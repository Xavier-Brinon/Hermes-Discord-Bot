'use strict';

// Deterministic tests for the pure text/URL helpers extracted into text.js
// (issue 6115cc3). No Hermes, no Discord.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  extractLinks,
  extractLinkMeta,
  mentionsUser,
  isReplyTo,
  unwrapText,
  splitAtBoundaries,
  safeReply,
  buildThreadTitle,
  sendLongResponse,
  postInThread,
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

// --- extractLinks ---------------------------------------------------------
// The 📝-reaction trigger summarises whatever a human reacted to — every link, no host
// filter — and reads [] as "no link, stay silent" (issues c8dafc0, 71e2200).

test('extractLinks — returns the link in a message', () => {
  assert.deepEqual(extractLinks('à lire : https://lemonde.fr/article/123'), [
    'https://lemonde.fr/article/123',
  ]);
});

test('extractLinks — [] when there is no link (stay silent)', () => {
  assert.deepEqual(extractLinks('bonjour tout le monde'), []);
});

test('extractLinks — keeps YouTube/Spotify/media links (no host filter)', () => {
  // The human reacted 📝 deliberately, so these are NOT dropped anymore.
  assert.deepEqual(extractLinks('https://youtube.com/watch?v=abc'), [
    'https://youtube.com/watch?v=abc',
  ]);
  assert.deepEqual(extractLinks('https://open.spotify.com/track/0RwtlGnvXFIZ9OuKlAm2F5'), [
    'https://open.spotify.com/track/0RwtlGnvXFIZ9OuKlAm2F5',
  ]);
});

test('extractLinks — returns every link, in order', () => {
  assert.deepEqual(extractLinks('un https://lemonde.fr/1 puis https://youtube.com/watch?v=x'), [
    'https://lemonde.fr/1',
    'https://youtube.com/watch?v=x',
  ]);
});

test('extractLinks — no throw on empty/null/undefined', () => {
  assert.deepEqual(extractLinks(''), []);
  assert.deepEqual(extractLinks(null), []);
  assert.deepEqual(extractLinks(undefined), []);
});

// --- extractLinkMeta ------------------------------------------------------
// Ground-truth {title, author, provider} from the Discord message embed, so the summariser
// can anchor Hermes and abstain instead of hallucinating (issue 1b94451). Duck-typed embeds.

test('extractLinkMeta — reads title/author/provider from the (sole) embed', () => {
  const message = {
    embeds: [
      {
        url: 'https://www.youtube.com/watch?v=abc',
        title: 'Et si les fées existaient vraiment ?',
        author: { name: 'FLORIEGRAPHIE' },
        provider: { name: 'YouTube' },
      },
    ],
  };
  assert.deepEqual(extractLinkMeta(message, 'https://youtu.be/abc'), {
    title: 'Et si les fées existaient vraiment ?',
    author: 'FLORIEGRAPHIE',
    provider: 'YouTube',
  });
});

test('extractLinkMeta — with several embeds, picks the one whose url matches the link', () => {
  const message = {
    embeds: [
      { url: 'https://a.com/1', title: 'Un', author: { name: 'A' } },
      { url: 'https://b.com/2', title: 'Deux', author: { name: 'B' } },
    ],
  };
  assert.deepEqual(extractLinkMeta(message, 'https://b.com/2'), {
    title: 'Deux',
    author: 'B',
    provider: null,
  });
});

test('extractLinkMeta — null when there is no embed / no title', () => {
  assert.equal(extractLinkMeta({ embeds: [] }, 'https://x'), null);
  assert.equal(extractLinkMeta({ embeds: [{ url: 'https://x' }] }, 'https://x'), null);
});

test('extractLinkMeta — no url match across multiple embeds → null (no wrong anchor)', () => {
  const message = {
    embeds: [
      { url: 'https://a.com/1', title: 'Un' },
      { url: 'https://b.com/2', title: 'Deux' },
    ],
  };
  assert.equal(extractLinkMeta(message, 'https://c.com/3'), null);
});

test('extractLinkMeta — no throw on missing message/embeds', () => {
  assert.equal(extractLinkMeta(null, 'https://x'), null);
  assert.equal(extractLinkMeta({}, 'https://x'), null);
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

// --- buildThreadTitle -----------------------------------------------------

test('buildThreadTitle — short text is prefixed with 📄 and left intact', () => {
  assert.equal(buildThreadTitle('Comment marche Raft ?'), '📄 Comment marche Raft ?');
});

test('buildThreadTitle — collapses whitespace/newlines to single spaces', () => {
  assert.equal(buildThreadTitle('Para un.\n\n  Para deux.'), '📄 Para un. Para deux.');
});

test('buildThreadTitle — empty/whitespace/null/undefined fall back to the generic title', () => {
  const fallback = '📄 Réponse détaillée';
  assert.equal(buildThreadTitle(''), fallback);
  assert.equal(buildThreadTitle('   '), fallback);
  assert.equal(buildThreadTitle(null), fallback);
  assert.equal(buildThreadTitle(undefined), fallback);
});

test('buildThreadTitle — a long title truncates to ≤ 100 code points ending with …', () => {
  const result = buildThreadTitle('mot '.repeat(40)); // 160 chars of "mot "
  assert.ok(Array.from(result).length <= 100, 'stays within Discord 100-char cap');
  assert.ok(result.endsWith('…'), 'ends with an ellipsis');
});

test('buildThreadTitle — truncates on a word boundary (no mid-word cut)', () => {
  const result = buildThreadTitle('mot '.repeat(40));
  assert.ok(result.endsWith('mot…'), 'the cut lands after a complete word');
});

test('buildThreadTitle — never splits a surrogate-pair emoji when truncating', () => {
  const result = buildThreadTitle('😀'.repeat(100)); // 100 code points of emoji, over the cap
  assert.ok(Array.from(result).length <= 100, 'stays within cap');
  assert.ok(result.endsWith('😀…'), 'last kept char is a whole emoji, not half a surrogate pair');
});

// --- sendLongResponse -----------------------------------------------------
// Resolves to the posted Message(s) so the bot can key the session on them (issue 244bad7).

// A duck-typed channel that records sends and returns a fake Message placed in it.
function fakeChannel(isThread, isDM = false) {
  const channel = { isThread: () => isThread, isDMBased: () => isDM, sent: [] };
  channel.send = async (text) => {
    const msg = { id: `m${channel.sent.length}`, channel, text };
    channel.sent.push(msg);
    return msg;
  };
  return channel;
}

test('sendLongResponse — short text: one reply, returned in an array', async () => {
  const reply = { id: 'r1' };
  const message = { channel: fakeChannel(false), reply: async () => reply };
  assert.deepEqual(await sendLongResponse(message, 'court'), [reply]);
});

test('sendLongResponse — long text in a thread: returns every chunk posted there', async () => {
  const channel = fakeChannel(true);
  const posted = await sendLongResponse({ channel }, 'Phrase. '.repeat(600));
  assert.ok(posted.length > 1, 'split into several chunks');
  assert.deepEqual(posted, channel.sent);
});

test('sendLongResponse — long text in a channel: returns the chunks of the new thread', async () => {
  const thread = fakeChannel(true);
  const message = { channel: fakeChannel(false), startThread: async () => thread };
  const posted = await sendLongResponse(message, 'Phrase. '.repeat(600));
  assert.ok(posted.length > 1);
  assert.ok(
    posted.every((m) => m.channel === thread),
    'all chunks landed in the new thread'
  );
});

test('sendLongResponse — long text in a DM: chunks posted in the DM, no thread (issue 1631596)', async () => {
  const channel = fakeChannel(false, true);
  const message = {
    channel,
    startThread: async () => assert.fail('a DM channel cannot have threads'),
  };
  const posted = await sendLongResponse(message, 'Phrase. '.repeat(600));
  assert.ok(posted.length > 1);
  assert.deepEqual(posted, channel.sent);
});

// --- postInThread ---------------------------------------------------------
// A 📝 summary always goes in a thread, whatever its length (issue f16ff0f, ADR 0001).

const SHORT_SUMMARY = 'Intro.\n\n**Idée principale** : x.\n\n**Points clés** :\n1. **A** : y.';

test('postInThread — short text in a channel: ONE message in a new thread, named as asked', async () => {
  const thread = fakeChannel(true);
  let options;
  const message = {
    channel: fakeChannel(false),
    hasThread: false,
    startThread: async (o) => ((options = o), thread),
  };
  const posted = await postInThread(message, SHORT_SUMMARY, '📄 Titre');
  assert.equal(posted.length, 1, 'blank lines must not split a text that fits');
  assert.equal(posted[0].text, SHORT_SUMMARY);
  assert.equal(posted[0].channel, thread);
  assert.equal(options.name, '📄 Titre');
});

test('postInThread — long text in a channel: every chunk in the new thread', async () => {
  const thread = fakeChannel(true);
  const message = {
    channel: fakeChannel(false),
    hasThread: false,
    startThread: async () => thread,
  };
  const posted = await postInThread(message, 'Phrase. '.repeat(600));
  assert.ok(posted.length > 1);
  assert.deepEqual(posted, thread.sent);
});

test('postInThread — message already has a cached thread: reuses it, never startThread', async () => {
  const thread = fakeChannel(true);
  const message = {
    channel: fakeChannel(false),
    hasThread: true,
    thread,
    startThread: async () => assert.fail('a second startThread throws MessageExistingThread'),
  };
  const posted = await postInThread(message, SHORT_SUMMARY);
  assert.deepEqual(posted, thread.sent);
});

test('postInThread — message has an uncached thread: fetched by the message id', async () => {
  const thread = fakeChannel(true);
  const channel = fakeChannel(false);
  channel.threads = {
    fetch: async (id) => (id === 'msg1' ? thread : assert.fail(`fetched ${id}`)),
  };
  const message = {
    id: 'msg1',
    channel,
    hasThread: true,
    thread: null,
    startThread: async () => assert.fail('must not start a second thread'),
  };
  const posted = await postInThread(message, SHORT_SUMMARY);
  assert.deepEqual(posted, thread.sent);
});

test('postInThread — in a thread or a DM: posts there, no new thread', async () => {
  for (const channel of [fakeChannel(true), fakeChannel(false, true)]) {
    const message = { channel, startThread: async () => assert.fail('no nested / DM thread') };
    const posted = await postInThread(message, SHORT_SUMMARY);
    assert.deepEqual(posted, channel.sent);
    assert.equal(posted.length, 1);
  }
});
