// cache.js
// Persistence: the last summarised link URL per channel, and Hermes session ids per reply
// chain for conversation continuity. The Maps are module-private (the load path replaces them, so
// exporting the reference would stale); callers use the accessors, which save on write.
// Loaded once on require, reproducing the entrypoint's previous startup load. (issue 950dc54)

'use strict';

const fs = require('fs');
const { CACHE_FILE, SESSION_CACHE_FILE } = require('./config');

let lastLinkPerChannel = new Map();
let sessions = new Map(); // key: msg:<answerId>, or a thread/DM place key (see placeKey)
const MAX_SESSIONS = 500;

// Load persisted caches on require (startup).
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    lastLinkPerChannel = new Map(Object.entries(data));
    console.log(`📦 Loaded link cache: ${lastLinkPerChannel.size} entries`);
  }
  if (fs.existsSync(SESSION_CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(SESSION_CACHE_FILE, 'utf-8'));
    sessions = new Map(Object.entries(data));
    console.log(`📦 Loaded session cache: ${sessions.size} entries`);
  }
} catch (e) {
  console.error('Failed to load caches:', e.message);
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(lastLinkPerChannel)));
  } catch (e) {
    console.error('Failed to save link cache:', e.message);
  }
}

function saveSessionCache() {
  try {
    fs.writeFileSync(SESSION_CACHE_FILE, JSON.stringify(Object.fromEntries(sessions)));
  } catch (e) {
    console.error('Failed to save session cache:', e.message);
  }
}

// Sessions are keyed by reply chain, not by channel (issue 244bad7): every answer the bot
// posts is recorded as msg:<id>, and a reply to it resumes that session — so two people
// talking to the bot in one channel never share (or overwrite) a session. A thread or DM is
// one conversation by nature, where people follow up without Discord's reply button, so it
// is also keyed as a place. A fresh @mention in a channel matches neither and starts anew.
const answerKey = (messageId) => `msg:${messageId}`;

function placeKey(channel) {
  if (channel.isThread()) return `${channel.parentId}:${channel.id}`;
  if (channel.isDMBased()) return channel.id;
  return null;
}

// The session to resume for an incoming message: the replied-to answer's, else the
// thread/DM's latest, else undefined (start a new chain).
function findSessionId(message) {
  const repliedId = message.reference?.messageId;
  const fromReply = repliedId && sessions.get(answerKey(repliedId));
  const place = placeKey(message.channel);
  return fromReply || (place ? sessions.get(place) : undefined);
}

// Bounded FIFO like PROCESSED_MESSAGES: re-inserting moves a key to the newest end, and the
// oldest entry is evicted past the cap. Replying to an evicted answer just starts fresh.
function remember(key, sessionId) {
  sessions.delete(key);
  sessions.set(key, sessionId);
  if (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
}

// Record a session under every message the bot posted for one answer (a long answer is
// several chunks — a reply to any of them resumes) and under the place they landed in, which
// covers a thread sendLongResponse just created.
function recordSession(sessionId, answers) {
  for (const answer of answers) {
    remember(answerKey(answer.id), sessionId);
    const place = placeKey(answer.channel);
    if (place) remember(place, sessionId);
  }
  saveSessionCache();
}

const getCachedLink = (channelId) => lastLinkPerChannel.get(channelId);

function setCachedLink(channelId, url) {
  lastLinkPerChannel.set(channelId, url);
  saveCache();
}

module.exports = {
  getCachedLink,
  setCachedLink,
  findSessionId,
  recordSession,
  MAX_SESSIONS,
};
