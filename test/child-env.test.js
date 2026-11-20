'use strict';

// childEnv (issue 03dee16): children get an allowlisted env, never the bot's secrets.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { childEnv } = require('../child-env');
const { probeHermes } = require('../hermes-cli');

test('drops the bot secrets and anything not on the allowlist', () => {
  const env = childEnv({
    PATH: '/usr/bin',
    HOME: '/data',
    HERMES_HOME: '/data',
    LC_ALL: 'C.UTF-8',
    DISCORD_BOT_TOKEN: 'secret',
    HERMES_DISCORD_TOKEN: 'secret',
    DOTENV_PRIVATE_KEY: 'secret',
    HERMES_WEBUI_PASSWORD: 'secret',
    ADMIN_USER_ID: '123',
  });
  assert.deepEqual(env, {
    PATH: '/usr/bin',
    HOME: '/data',
    HERMES_HOME: '/data',
    LC_ALL: 'C.UTF-8',
  });
});

test('a real child started through probeHermes does not see DISCORD_BOT_TOKEN', async (t) => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'child-env-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'hermes-env');
  fs.writeFileSync(
    bin,
    '#!/bin/sh\necho "token=${DISCORD_BOT_TOKEN:-absent} home=$HERMES_HOME"\n',
    {
      mode: 0o755,
    }
  );
  const saved = { token: process.env.DISCORD_BOT_TOKEN, home: process.env.HERMES_HOME };
  t.after(() => {
    for (const [name, value] of [
      ['DISCORD_BOT_TOKEN', saved.token],
      ['HERMES_HOME', saved.home],
    ]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  process.env.DISCORD_BOT_TOKEN = 'leaked';
  process.env.HERMES_HOME = '/data';
  assert.equal((await probeHermes(bin)).version, 'token=absent home=/data');
});

// A new execFile call that forgets `env` would silently reopen the leak.
test('every execFile call in the source passes childEnv()', () => {
  const root = path.join(__dirname, '..');
  const files = [
    ...fs.readdirSync(root).filter((f) => f.endsWith('.js')),
    ...fs.readdirSync(path.join(root, 'evals')).map((f) => path.join('evals', f)),
  ].filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    // Every child_process launcher, not only execFile. `.exec(` (RegExp) is excluded, and so is
    // prose like "execFile (no shell)" in comments: a call has no space before its parenthesis.
    const launcher = /(?<![.\w])(execFile|execFileSync|exec|execSync|spawn|spawnSync|fork)\(/g;
    const calls = (src.match(launcher) || []).length;
    const envs = (src.match(/env: childEnv\(\)/g) || []).length;
    assert.equal(envs, calls, `${file}: ${calls} execFile call(s), ${envs} env: childEnv()`);
  }
});
