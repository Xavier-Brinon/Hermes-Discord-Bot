'use strict';

// Deterministic tests for the pure text/URL helpers extracted into text.js
// (issue 6115cc3). No Hermes, no Discord.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isNonArticleUrl, unwrapText, splitAtBoundaries, safeReply } = require('../text');

// --- unwrapText -----------------------------------------------------------

test('unwrapText — merges mid-sentence wrapped lines into one paragraph', () => {
  assert.equal(
    unwrapText('Bonjour ceci est\nune phrase coupée.'),
    'Bonjour ceci est une phrase coupée.'
  );
});

test('unwrapText — a blank line is a paragraph break (preserved)', () => {
  assert.equal(unwrapText('Para un.\n\nPara deux.'), 'Para un.\n\nPara deux.');
});

test('unwrapText — THEME: lines stay standalone (summary not merged in)', () => {
  assert.equal(
    unwrapText('THEME: Sujet A\nDescription qui suit.'),
    'THEME: Sujet A\nDescription qui suit.'
  );
});

test('unwrapText — a --- rule stays on its own line', () => {
  assert.equal(unwrapText('Texte\n---\nPlus'), 'Texte\n---\nPlus');
});

test('unwrapText — a structural marker (📊) starts a new paragraph', () => {
  assert.equal(unwrapText('Intro\n📊 Titre'), 'Intro\n📊 Titre');
});

test('unwrapText — empty input is returned as-is', () => {
  assert.equal(unwrapText(''), '');
  assert.equal(unwrapText(null), null);
});

// --- splitAtBoundaries ----------------------------------------------------

test('splitAtBoundaries — text under maxLen is a single chunk', () => {
  assert.deepEqual(splitAtBoundaries('court', 100), ['court']);
});

test('splitAtBoundaries — splits at paragraph boundaries; every chunk <= maxLen', () => {
  const chunks = splitAtBoundaries('aaaa\nbbbb\ncccc', 10);
  assert.deepEqual(chunks, ['aaaa\nbbbb', 'cccc']);
  for (const c of chunks) assert.ok(c.length <= 10, `chunk "${c}" exceeds maxLen`);
});

test('splitAtBoundaries — hard-splits an over-long single paragraph; every chunk <= maxLen', () => {
  const chunks = splitAtBoundaries('abcdefghij klmnop.', 10);
  for (const c of chunks) assert.ok(c.length <= 10, `chunk "${c}" exceeds maxLen`);
  // round-trips the words (whitespace boundaries), nothing dropped
  assert.equal(chunks.join(' ').replace(/\s+/g, ' ').trim(), 'abcdefghij klmnop.');
});

// --- isNonArticleUrl ------------------------------------------------------

test('isNonArticleUrl — social / video / image URLs are non-articles', () => {
  assert.equal(isNonArticleUrl('https://youtube.com/watch?v=abc'), true);
  assert.equal(isNonArticleUrl('https://x.com/user/status/1'), true);
  assert.equal(isNonArticleUrl('https://example.com/photo.jpg'), true);
});

test('isNonArticleUrl — music-streaming / song links are non-articles (bot stays silent)', () => {
  // The incident URL: a Spotify track that the bot wrongly summarised.
  assert.equal(
    isNonArticleUrl(
      'https://open.spotify.com/track/0RwtlGnvXFIZ9OuKlAm2F5?si=T2_CXWiFR9ylRM4JlrKUug'
    ),
    true
  );
  assert.equal(isNonArticleUrl('https://spotify.link/abc123'), true);
  assert.equal(isNonArticleUrl('https://music.apple.com/fr/album/x/123'), true);
  assert.equal(isNonArticleUrl('https://soundcloud.com/artist/track'), true);
  assert.equal(isNonArticleUrl('https://www.deezer.com/track/123'), true);
  assert.equal(isNonArticleUrl('https://artist.bandcamp.com/track/song'), true);
  assert.equal(isNonArticleUrl('https://tidal.com/browse/track/123'), true);
  assert.equal(isNonArticleUrl('https://music.amazon.fr/albums/ABC'), true);
});

test('isNonArticleUrl — a plain article URL is an article', () => {
  assert.equal(isNonArticleUrl('https://lemonde.fr/article/123'), false);
});

test('isNonArticleUrl — reddit posts are articles (NOT skipped — some are worth a summary)', () => {
  assert.equal(
    isNonArticleUrl('https://www.reddit.com/r/france/comments/abc123/titre_du_post/'),
    false
  );
  assert.equal(isNonArticleUrl('https://old.reddit.com/r/programming/comments/xyz/'), false);
});

// --- safeReply ------------------------------------------------------------
// Duck-typed message object (like sendLongResponse), no real Discord client (issue 1ff433a).

test('safeReply — returns the sent message on success', async () => {
  const sent = { id: 'sent-1' };
  const message = { reply: async () => sent };
  assert.equal(await safeReply(message, 'salut'), sent);
});

test('safeReply — swallows a rejected reply (returns null, does not throw)', async () => {
  const message = {
    reply: async () => {
      throw new Error('Missing Permissions');
    },
  };
  // Silence the expected console.error so the test output stays clean.
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(await safeReply(message, 'salut'), null);
  } finally {
    console.error = original;
  }
});
