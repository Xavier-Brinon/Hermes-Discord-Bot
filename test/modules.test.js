'use strict';

// Module-load smoke tests (issue 950dc54). Requiring each module exercises the
// dependency graph — catching import cycles, missing imports, and load-time errors —
// and asserts each module's public API. The entrypoint is NOT required here (it logs in
// to Discord on load); these cover the extracted modules.

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('config — exports constants, paths, patterns, messagesFR', () => {
  const c = require('../config');
  for (const k of [
    'HERMES_BIN',
    'CACHE_FILE',
    'SESSION_CACHE_FILE',
    'TIMEOUT_RECAP',
    'MAX_ARGV_PROMPT_BYTES',
    'DISCORD_MSG_LIMIT',
  ]) {
    assert.ok(c[k] !== undefined, `config.${k} missing`);
  }
  assert.ok(c.LINK_PATTERN instanceof RegExp);
  assert.ok(c.HISTORY_PATTERN instanceof RegExp);
  assert.equal(typeof c.messagesFR.greeting, 'string');
});

test('text — exports the text/url helpers including the moved formatHermesResponse/sendLongResponse', () => {
  const t = require('../text');
  for (const fn of [
    'unwrapText',
    'splitAtBoundaries',
    'extractLinks',
    'formatHermesResponse',
    'sendLongResponse',
  ]) {
    assert.equal(typeof t[fn], 'function', `text.${fn} not a function`);
  }
});

test('recap — exports parseTimeframe + the moved fetchChannelHistory/scanChannelForLinks', () => {
  const r = require('../recap');
  for (const fn of ['parseTimeframe', 'fetchChannelHistory', 'scanChannelForLinks']) {
    assert.equal(typeof r[fn], 'function', `recap.${fn} not a function`);
  }
});

test('cache — exports the accessor API', () => {
  const cache = require('../cache');
  for (const fn of [
    'getSessionKey',
    'getCachedLink',
    'setCachedLink',
    'getSessionId',
    'setSessionId',
  ]) {
    assert.equal(typeof cache[fn], 'function', `cache.${fn} not a function`);
  }
});

test('hermes-cli — loads (exercises config+prompts+text edges) and exports askHermes/summarizeLink', () => {
  const h = require('../hermes-cli');
  assert.equal(typeof h.askHermes, 'function');
  assert.equal(typeof h.summarizeLink, 'function');
});

test('config — HERMES_BIN / cache paths honour env overrides (df0d693)', () => {
  const resolved = require.resolve('../config');
  const saved = { bin: process.env.HERMES_BIN, ws: process.env.WORKSPACE_DIR };
  try {
    delete require.cache[resolved];
    process.env.HERMES_BIN = '/custom/bin/hermes';
    process.env.WORKSPACE_DIR = '/custom/ws';
    const c = require('../config');
    assert.equal(c.HERMES_BIN, '/custom/bin/hermes');
    assert.equal(c.CACHE_FILE, '/custom/ws/.link_cache.json');
    assert.equal(c.SESSION_CACHE_FILE, '/custom/ws/.session_cache.json');
  } finally {
    delete require.cache[resolved];
    if (saved.bin === undefined) delete process.env.HERMES_BIN;
    else process.env.HERMES_BIN = saved.bin;
    if (saved.ws === undefined) delete process.env.WORKSPACE_DIR;
    else process.env.WORKSPACE_DIR = saved.ws;
  }
});
