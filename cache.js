// cache.js
// Per-channel persistence: the last summarised link URL and the Hermes session id for
// conversation continuity. The Maps are module-private (the load path replaces them, so
// exporting the reference would stale); callers use the accessors, which save on write.
// Loaded once on require, reproducing the entrypoint's previous startup load. (issue 950dc54)

'use strict';

const fs = require('fs');
const { CACHE_FILE, SESSION_CACHE_FILE } = require('./config');

let lastLinkPerChannel = new Map();
let lastSessionPerChannel = new Map(); // key: channelId or channelId:threadId

// Load persisted caches on require (startup).
try {
  if (fs.existsSync(CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    lastLinkPerChannel = new Map(Object.entries(data));
    console.log(`📦 Loaded link cache: ${lastLinkPerChannel.size} entries`);
  }
  if (fs.existsSync(SESSION_CACHE_FILE)) {
    const data = JSON.parse(fs.readFileSync(SESSION_CACHE_FILE, 'utf-8'));
    lastSessionPerChannel = new Map(Object.entries(data));
    console.log(`📦 Loaded session cache: ${lastSessionPerChannel.size} entries`);
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
    fs.writeFileSync(SESSION_CACHE_FILE, JSON.stringify(Object.fromEntries(lastSessionPerChannel)));
  } catch (e) {
    console.error('Failed to save session cache:', e.message);
  }
}

// The session key for a message (channel ID, or channel:thread if in a thread).
function getSessionKey(message) {
  if (message.channel.isThread()) {
    return `${message.channel.parentId}:${message.channel.id}`;
  }
  return message.channel.id;
}

const getCachedLink = (channelId) => lastLinkPerChannel.get(channelId);

function setCachedLink(channelId, url) {
  lastLinkPerChannel.set(channelId, url);
  saveCache();
}

const getSessionId = (sessionKey) => lastSessionPerChannel.get(sessionKey);

function setSessionId(sessionKey, id) {
  lastSessionPerChannel.set(sessionKey, id);
  saveSessionCache();
}

module.exports = {
  getSessionKey,
  getCachedLink,
  setCachedLink,
  getSessionId,
  setSessionId,
};
