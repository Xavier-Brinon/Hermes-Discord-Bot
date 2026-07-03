'use strict';

// Deterministic tests for the pure text/URL helpers extracted into text.js
// (issue 6115cc3). No Hermes, no Discord.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  isNonArticleUrl,
  mentionsUser,
  isReplyTo,
  unwrapText,
  splitAtBoundaries,
  safeReply,
} = require('../text');

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

// --- mentionsUser ---------------------------------------------------------
// Gate for the Q&A path: only a real @mention in the message text counts, NOT
// @everyone/@here, a role the bot holds, or a reply to the bot (issue f482c08).

const BOT_ID = '123456789012345678';

test('mentionsUser — true for a direct <@id> mention', () => {
  assert.equal(mentionsUser(`salut <@${BOT_ID}> ça va ?`, BOT_ID), true);
});

test('mentionsUser — true for the <@!id> nickname form', () => {
  assert.equal(mentionsUser(`<@!${BOT_ID}> résume ce lien`, BOT_ID), true);
});

test('mentionsUser — false for a plain sentence (no token → the reported bug)', () => {
  assert.equal(mentionsUser('je pense que la grève est justifiée', BOT_ID), false);
});

test('mentionsUser — false for @everyone/@here (no bot token in content)', () => {
  assert.equal(mentionsUser('@everyone réunion à 15h', BOT_ID), false);
  assert.equal(mentionsUser('@here on commence', BOT_ID), false);
});

test('mentionsUser — false for a mention of a DIFFERENT user', () => {
  assert.equal(mentionsUser('<@987654321098765432> tu en penses quoi ?', BOT_ID), false);
});

test('mentionsUser — false when the bot id is a substring of a longer id (> anchor)', () => {
  // A different user whose id starts with the bot's id must NOT match.
  assert.equal(mentionsUser(`<@${BOT_ID}0>`, BOT_ID), false);
});

test('mentionsUser — false/no-throw on empty or missing content', () => {
  assert.equal(mentionsUser('', BOT_ID), false);
  assert.equal(mentionsUser(null, BOT_ID), false);
  assert.equal(mentionsUser(undefined, BOT_ID), false);
});

// --- isReplyTo ------------------------------------------------------------
// Reply-to-bot counts as a mention (issue 92b16a6). Duck-typed message: Discord sets
// message.mentions.repliedUser to the replied-to author, and only for replies.

test('isReplyTo — true when the message replies to the given user', () => {
  assert.equal(isReplyTo({ mentions: { repliedUser: { id: BOT_ID } } }, BOT_ID), true);
});

test('isReplyTo — false when the reply is to a DIFFERENT user', () => {
  assert.equal(
    isReplyTo({ mentions: { repliedUser: { id: '987654321098765432' } } }, BOT_ID),
    false
  );
});

test('isReplyTo — false when not a reply (repliedUser null/absent)', () => {
  assert.equal(isReplyTo({ mentions: { repliedUser: null } }, BOT_ID), false);
  assert.equal(isReplyTo({ mentions: {} }, BOT_ID), false);
});

test('isReplyTo — no throw on missing mentions/message', () => {
  assert.equal(isReplyTo({}, BOT_ID), false);
  assert.equal(isReplyTo(null, BOT_ID), false);
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
