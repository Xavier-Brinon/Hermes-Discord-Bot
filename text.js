// text.js
// Text/URL helpers the bot uses to shape Hermes output and pull links out of messages. The
// core helpers (unwrapText, splitAtBoundaries, extractLinks) are pure and unit-tested
// (issue 6115cc3). formatHermesResponse + sendLongResponse were added with the
// modularisation (issue 950dc54): formatHermesResponse is pure; sendLongResponse does
// Discord I/O (it splits then sends), operating on a duck-typed message object.

'use strict';

const { messagesFR, DISCORD_MSG_LIMIT, LINK_PATTERN } = require('./config');

// Global variant of config.LINK_PATTERN to collect EVERY URL in a message — String.match
// with the non-global LINK_PATTERN returns only the first. Built once; String.match with a
// global regex does not use lastIndex, so this module-level instance is safe to reuse.
const ALL_LINKS_PATTERN = new RegExp(LINK_PATTERN.source, 'gi');

// Every URL in `content`, in order; [] when there is none. No host filter — the 📝-reaction
// handler summarises whatever a human deliberately reacted to (the reaction IS the "worth
// summarising" decision), so it reads [] as "no link, stay silent". Pure; the caller caps
// how many it summarises. The former isNonArticleUrl/NON_ARTICLE_PATTERN denylist (issue
// e89a541) existed only for the auto-summary path, which is gone (issue c8dafc0) — dropped
// here so an explicit 📝 on a YouTube/Spotify link is summarised, not silently skipped. See
// issue 71e2200.
function extractLinks(content) {
  return (content || '').match(ALL_LINKS_PATTERN) || [];
}

// True when the user directly @mentioned `userId` in the message TEXT — i.e. typed
// @Bot, so its `<@id>` / `<@!id>` token is in the content (the same token the handler
// strips). Deliberately content-only: unlike discord.js's message.mentions.has(),
// which by default also returns true for @everyone/@here, a role the bot holds, and
// every reply to the bot's own message, this counts ONLY a real @mention — so the bot
// stops answering every reply and every @everyone. See issue f482c08.
function mentionsUser(content, userId) {
  return new RegExp(`<@!?${userId}>`).test(content || '');
}

// True when `message` is a reply to a message authored by `userId`. Discord sets
// message.mentions.repliedUser to the replied-to author for ANY reply (ping on or off)
// and ONLY for replies, so a reply to the bot counts as a mention while @everyone, a
// role the bot holds, a plain message, and a reply to someone else do NOT — it pairs
// with mentionsUser to allow conversation-continuation without reintroducing the noise
// f482c08 removed. See issue 92b16a6.
function isReplyTo(message, userId) {
  return message?.mentions?.repliedUser?.id === userId;
}

// Unwrap terminal-formatted text: merge lines broken mid-sentence
// Hermes outputs at ~80 chars regardless of prompt instructions
function unwrapText(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const result = [];
  let buffer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Empty line = paragraph break
      if (buffer) {
        result.push(buffer);
        buffer = '';
      }
      result.push('');
      continue;
    }
    // Structural markers = new paragraph
    if (/^(📊|🔥|🔗|🤖|📌|❓|⚠️|##|THEME:|---$|[-\d]+[.)]\s)/.test(trimmed)) {
      if (buffer) {
        result.push(buffer);
        buffer = '';
      }
      // THEME: and --- lines must stay standalone — don't merge summary into them
      if (/^THEME:/i.test(trimmed) || trimmed === '---') {
        result.push(trimmed);
        // buffer stays empty so summary lines start fresh
      } else {
        buffer = trimmed;
      }
      continue;
    }
    // Merge: append to current paragraph
    if (buffer) {
      buffer += ' ' + trimmed;
    } else {
      buffer = trimmed;
    }
  }
  if (buffer) result.push(buffer);

  return result.join('\n');
}

// Split text into chunks each <= maxLen, preferring paragraph then sentence
// boundaries; an over-long single paragraph is hard-split. Caller passes the limit
// (the bot uses DISCORD_MSG_LIMIT = 1900, leaving margin under Discord's 2000).
function splitAtBoundaries(text, maxLen) {
  const chunks = [];
  const paragraphs = text.split('\n');
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      // Empty line = paragraph separator — flush current if non-empty
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      continue;
    }

    const candidate = current ? current + '\n' + trimmed : trimmed;

    if (candidate.length <= maxLen) {
      current = candidate;
    } else {
      // Candidate too long — flush current, start new chunk
      if (current) {
        chunks.push(current.trim());
      }
      // If this single paragraph exceeds maxLen, hard-split it
      if (trimmed.length > maxLen) {
        let remaining = trimmed;
        while (remaining.length > maxLen) {
          // Try to split at last sentence boundary (., !, ?, :, ;) within limit
          let cutAt = maxLen;
          const lastPunct = remaining.lastIndexOf('.', maxLen);
          if (lastPunct > maxLen * 0.6) cutAt = lastPunct + 1;
          else {
            const lastSpace = remaining.lastIndexOf(' ', maxLen);
            if (lastSpace > maxLen * 0.6) cutAt = lastSpace;
          }
          chunks.push(remaining.substring(0, cutAt).trim());
          remaining = remaining.substring(cutAt).trim();
        }
        current = remaining;
      } else {
        current = trimmed;
      }
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

// Format a Hermes response for Discord: unwrap terminal line-breaks, or fall back to the
// French "no info" message when empty. No truncation — the caller handles splitting.
function formatHermesResponse(response) {
  if (!response) return messagesFR.fallbackResponse;
  return unwrapText(response);
}

// Reply to a Discord message without letting a rejected reply escape as an unhandled
// rejection (issue 1ff433a). message.reply can reject when the bot lacks Send-Messages
// permission or the channel was deleted; such failures must be logged, not crash the
// PM2-supervised process. Returns the sent message on success, null on failure.
async function safeReply(message, content) {
  try {
    return await message.reply(content);
  } catch (e) {
    console.error('Reply failed:', e.message);
    return null;
  }
}

// Send a (possibly long) text to Discord: one reply if it fits, else split at boundaries
// and post the chunks — directly in a thread, or in a new thread otherwise.
async function sendLongResponse(message, text) {
  if (text.length <= DISCORD_MSG_LIMIT) {
    // Fits in one message — simple reply
    await message.reply(text);
    return;
  }

  const chunks = splitAtBoundaries(text, DISCORD_MSG_LIMIT);

  // If already in a thread, post chunks directly — no sub-thread
  if (message.channel.isThread()) {
    for (const chunk of chunks) {
      await message.channel.send(chunk);
    }
    return;
  }

  // Create a thread and post chunks
  const thread = await message.startThread({
    name: '📄 Réponse détaillée',
    autoArchiveDuration: 60,
  });

  for (const chunk of chunks) {
    await thread.send(chunk);
  }
}

module.exports = {
  extractLinks,
  mentionsUser,
  isReplyTo,
  unwrapText,
  splitAtBoundaries,
  formatHermesResponse,
  safeReply,
  sendLongResponse,
};
