'use strict';

// loadEnv (issue e39e496): .env is decrypted inside the bot, with the key from .env.keys next to
// the file, and a missing key stops startup instead of leaving an `encrypted:` value behind.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const dotenvx = require('@dotenvx/dotenvx');
const { loadEnv } = require('../load-env');

// An encrypted .env plus its .env.keys in a fresh temp dir, like the VPS workspace.
function encryptedEnv(t) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'load-env-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const envPath = path.join(dir, '.env');
  dotenvx.set('DISCORD_BOT_TOKEN', 'test-token-value', { path: envPath });
  assert.match(fs.readFileSync(envPath, 'utf8'), /DISCORD_BOT_TOKEN="?encrypted:/);
  return { dir, envPath };
}

test('decrypts with the .env.keys next to .env, whatever the cwd', (t) => {
  const { envPath } = encryptedEnv(t);
  assert.notEqual(process.cwd(), path.dirname(envPath));
  const env = {};
  loadEnv(envPath, env);
  assert.equal(env.DISCORD_BOT_TOKEN, 'test-token-value');
});

// The VPS layout (issue 6fe5a3e): the real key lives outside Hermes's workspace and the
// workspace holds a symlink, which Hermes refuses to attach but dotenvx follows.
test('decrypts through a .env.keys symlink to another directory', (t) => {
  const { dir, envPath } = encryptedEnv(t);
  const secrets = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'load-env-secrets-')));
  t.after(() => fs.rmSync(secrets, { recursive: true, force: true }));
  fs.renameSync(path.join(dir, '.env.keys'), path.join(secrets, '.env.keys'));
  fs.symlinkSync(path.join(secrets, '.env.keys'), path.join(dir, '.env.keys'));
  const env = {};
  loadEnv(envPath, env);
  assert.equal(env.DISCORD_BOT_TOKEN, 'test-token-value');
});

test('throws when .env.keys is missing instead of loading ciphertext', (t) => {
  const { dir, envPath } = encryptedEnv(t);
  fs.rmSync(path.join(dir, '.env.keys'));
  const env = {};
  assert.throws(() => loadEnv(envPath, env), /MISSING_PRIVATE_KEY/);
});

test('keeps a variable that is already set (the hook relies on it for HERMES_*)', (t) => {
  const { envPath } = encryptedEnv(t);
  const env = { DISCORD_BOT_TOKEN: 'from-launcher' };
  loadEnv(envPath, env);
  assert.equal(env.DISCORD_BOT_TOKEN, 'from-launcher');
});
