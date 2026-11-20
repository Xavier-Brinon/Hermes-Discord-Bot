'use strict';

// Hermes runs in HERMES_CWD, outside the repo (issue d84e945): a fake Hermes binary prints its
// working directory and that directory's contents, which come back as the parsed response.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-cwd-')));
const cwd = path.join(dir, 'not-yet-created');
const bin = path.join(dir, 'hermes-pwd');
fs.writeFileSync(bin, '#!/bin/sh\necho "cwd=$(pwd)"\nls -A\n', { mode: 0o755 });
// config.js reads these at require time, so set them before loading hermes-cli.
process.env.HERMES_BIN = bin;
process.env.HERMES_CWD = cwd;
const { askHermes, summarizeLink } = require('../hermes-cli');
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('askHermes runs Hermes in HERMES_CWD, creating it with mode 0700', async () => {
  const { response } = await askHermes('Dis bonjour.');
  assert.match(response, new RegExp(`^cwd=${cwd}$`, 'm'));
  assert.equal(fs.statSync(cwd).mode & 0o777, 0o700);
});

test('recap offload writes its @file: context into HERMES_CWD, then removes it', async () => {
  const { response } = await askHermes('Résume.', { extraContext: 'x'.repeat(100 * 1024) });
  assert.match(response, /^\.hermes-recap-ctx-.*\.txt$/m);
  assert.deepEqual(fs.readdirSync(cwd), []);
});

test('summarizeLink runs Hermes in HERMES_CWD', async () => {
  const { summary } = await summarizeLink('https://example.org/article', '');
  assert.ok(summary.includes(`cwd=${cwd}`), summary);
});
