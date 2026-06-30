// text.js
// Text/URL helpers the bot uses to shape Hermes output and classify links. The core
// helpers (unwrapText, splitAtBoundaries, isNonArticleUrl) are pure and unit-tested
// (issue 6115cc3). formatHermesResponse + sendLongResponse were added with the
// modularisation (issue 950dc54): formatHermesResponse is pure; sendLongResponse does
// Discord I/O (it splits then sends), operating on a duck-typed message object.

'use strict';

const { messagesFR, DISCORD_MSG_LIMIT } = require('./config');

// URLs that are NOT articles — skip silently (used to filter auto link-summaries).
const NON_ARTICLE_PATTERN = /(youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|tiktok\.com|reddit\.com|facebook\.com|discord\.com|imgur\.com|giphy\.com|tenor\.com|\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi|mp3|wav|ogg)(\?|$))/i;

// True when a URL is a non-article (social/media/image) link the bot should not summarise.
function isNonArticleUrl(url) {
  return NON_ARTICLE_PATTERN.test(url);
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
      if (buffer) { result.push(buffer); buffer = ''; }
      result.push('');
      continue;
    }
    // Structural markers = new paragraph
    if (/^(📊|🔥|🔗|🤖|📌|❓|⚠️|##|THEME:|---$|[-\d]+[.)]\s)/.test(trimmed)) {
      if (buffer) { result.push(buffer); buffer = ''; }
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
    autoArchiveDuration: 60
  });

  for (const chunk of chunks) {
    await thread.send(chunk);
  }
}

module.exports = {
  NON_ARTICLE_PATTERN,
  isNonArticleUrl,
  unwrapText,
  splitAtBoundaries,
  formatHermesResponse,
  sendLongResponse,
};
