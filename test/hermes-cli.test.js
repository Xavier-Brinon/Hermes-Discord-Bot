'use strict';

// probeHermes (issue 9afaeac): the startup probe resolves which Hermes binary will run and
// its version, and never rejects. Fake binaries are tiny sh scripts in a temp dir.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { probeHermes } = require('../hermes-cli');

function fakeBin(dir, name, body, mode = 0o755) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, `#!/bin/sh\n${body}\n`, { mode });
  return p;
}

const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'probe-hermes-')));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('absolute path — resolves the path and the first --version line', async () => {
  const bin = fakeBin(dir, 'hermes-ok', 'echo "Hermes Agent v0.16.0"; echo "extra line"');
  assert.deepEqual(await probeHermes(bin), {
    path: bin,
    version: 'Hermes Agent v0.16.0',
    error: null,
  });
});

test('symlink — reports the real target', async () => {
  const target = fakeBin(dir, 'hermes-real', 'echo v1');
  const link = path.join(dir, 'hermes-link');
  fs.symlinkSync(target, link);
  assert.equal((await probeHermes(link)).path, target);
});

test('bare name — looked up on PATH like execFile does', async () => {
  const bin = fakeBin(dir, 'hermes-onpath', 'echo v2');
  const saved = process.env.PATH;
  try {
    process.env.PATH = `/nonexistent${path.delimiter}${dir}`;
    assert.equal((await probeHermes('hermes-onpath')).path, bin);
  } finally {
    process.env.PATH = saved;
  }
});

test('missing binary — path null with an error, no throw', async () => {
  const r = await probeHermes(path.join(dir, 'nope'));
  assert.equal(r.path, null);
  assert.match(r.error, /not found or not executable/);
});

test('non-executable file — treated as missing', async () => {
  const bin = fakeBin(dir, 'hermes-noexec', 'echo v3', 0o644);
  assert.equal((await probeHermes(bin)).path, null);
});

test('--version fails — path kept, version null, error carries stderr', async () => {
  const bin = fakeBin(dir, 'hermes-broken', 'echo boom >&2; exit 1');
  assert.deepEqual(await probeHermes(bin), { path: bin, version: null, error: 'boom' });
});
