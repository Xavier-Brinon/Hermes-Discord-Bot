// text.js
// Pure text/URL helpers the bot uses to shape Hermes output and classify links.
// Extracted verbatim from hermes-discord-bot-clean.js so they can be unit-tested
// without the bot's Discord-login side effects (issue 6115cc3). No module state,
// no I/O — given the same input these always return the same output.

'use strict';

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

module.exports = { NON_ARTICLE_PATTERN, isNonArticleUrl, unwrapText, splitAtBoundaries };
