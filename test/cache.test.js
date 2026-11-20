'use strict';

// Reply-chain session keys in cache.js (issue 244bad7). Duck-typed messages/channels, no
// Discord client. WORKSPACE_DIR points at a temp dir so the session cache file writes there.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.WORKSPACE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'));

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findSessionId, recordSession, MAX_SESSIONS } = require('../cache');
const { SESSION_CACHE_FILE } = require('../config');

const guildChannel = (id) => ({ id, isThread: () => false, isDMBased: () => false });
const thread = (id, parentId) => ({ id, parentId, isThread: () => true, isDMBased: () => false });
const dm = (id) => ({ id, isThread: () => false, isDMBased: () => true });

// An answer the bot posted, and a message that replies to (or merely lands next to) one.
const answer = (id, channel) => ({ id, channel });
const incoming = (channel, repliedId) => ({
  channel,
  reference: repliedId ? { messageId: repliedId } : null,
});

test('two replies to two answers in one channel resume two distinct sessions', () => {
  const chan = guildChannel('c1');
  recordSession('S-alice', [answer('a1', chan)]);
  recordSession('S-bob', [answer('b1', chan)]);
  assert.equal(findSessionId(incoming(chan, 'a1')), 'S-alice');
  assert.equal(findSessionId(incoming(chan, 'b1')), 'S-bob');
});

test('a fresh @mention in a channel resumes nothing, even after answers there', () => {
  const chan = guildChannel('c2');
  recordSession('S-old', [answer('x1', chan)]);
  assert.equal(findSessionId(incoming(chan)), undefined);
});

test('a reply to an unknown message in a channel resumes nothing', () => {
  assert.equal(findSessionId(incoming(guildChannel('c3'), 'not-a-bot-answer')), undefined);
});

test('a plain follow-up in a thread or DM resumes that place', () => {
  const t = thread('t1', 'c4');
  const d = dm('d1');
  recordSession('S-thread', [answer('ta', t)]);
  recordSession('S-dm', [answer('da', d)]);
  assert.equal(findSessionId(incoming(t)), 'S-thread');
  assert.equal(findSessionId(incoming(d)), 'S-dm');
});

test('a long answer moved into a new thread: follow-ups in that thread resume it', () => {
  // The question sat in the channel; the chunks landed in a thread created for them.
  const t = thread('t2', 'c5');
  recordSession('S-long', [answer('k1', t), answer('k2', t)]);
  assert.equal(findSessionId(incoming(t)), 'S-long');
  assert.equal(findSessionId(incoming(t, 'k1')), 'S-long', 'reply to any chunk resumes');
});

test("inside a thread, replying to an older answer beats the thread's latest", () => {
  const t = thread('t3', 'c6');
  recordSession('S-first', [answer('f1', t)]);
  recordSession('S-second', [answer('f2', t)]);
  assert.equal(findSessionId(incoming(t, 'f1')), 'S-first');
  assert.equal(findSessionId(incoming(t)), 'S-second');
});

test('the map is capped: the oldest entry is evicted, and the cache file is written', () => {
  const chan = guildChannel('c7');
  recordSession('S-oldest', [answer('first', chan)]);
  for (let i = 0; i < MAX_SESSIONS; i++) recordSession(`S${i}`, [answer(`n${i}`, chan)]);
  assert.equal(findSessionId(incoming(chan, 'first')), undefined, 'evicted');
  assert.equal(findSessionId(incoming(chan, `n${MAX_SESSIONS - 1}`)), `S${MAX_SESSIONS - 1}`);
  const saved = JSON.parse(fs.readFileSync(SESSION_CACHE_FILE, 'utf-8'));
  assert.equal(Object.keys(saved).length, MAX_SESSIONS);
});
