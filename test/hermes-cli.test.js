'use strict';

// probeHermes (issue 9afaeac): the startup probe resolves which Hermes binary will run and
// its version, and never rejects. Fake binaries are tiny sh scripts in a temp dir.
// formatTimingLine (issue 6b61611): the per-call timing line the README read-out parses.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { probeHermes, formatTimingLine, buildAskArgs, cliErrorDetail } = require('../hermes-cli');

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

test('formatTimingLine — key=value fields, seconds with one decimal, whole-second limit', () => {
  assert.equal(
    formatTimingLine({ flow: 'ask', web: false, outcome: 'ok', elapsedMs: 12345, limitMs: 90000 }),
    '⏱️ hermes flow=ask web=no outcome=ok elapsed=12.3s limit=90s'
  );
  assert.equal(
    formatTimingLine({
      flow: 'link',
      web: true,
      outcome: 'timeout',
      elapsedMs: 150004,
      limitMs: 150000,
    }),
    '⏱️ hermes flow=link web=yes outcome=timeout elapsed=150.0s limit=150s'
  );
});

// buildAskArgs (issue 5cd6f24): every askHermes call pins `-t web`, so the Hermes profile's
// default (coding posture: terminal + file tools) is never what a Discord prompt gets.

test('buildAskArgs — fresh question pins -t web after chat', () => {
  const args = buildAskArgs('Bonjour');
  assert.deepEqual(args.slice(2, 7), ['chat', '-q', 'Bonjour', '-t', 'web']);
  assert.deepEqual(args.slice(-3), ['-Q', '--source', 'tool']);
  assert.ok(!args.includes('--resume'));
});

test('buildAskArgs — resume keeps --resume before chat and still pins -t web', () => {
  const args = buildAskArgs('Et ensuite ?', 'sess-42');
  assert.deepEqual(args.slice(2, 5), ['--resume', 'sess-42', 'chat']);
  assert.equal(args[args.indexOf('-t') + 1], 'web');
});

test('buildAskArgs — exactly one -t, no terminal/file toolset', () => {
  const args = buildAskArgs('q', 's');
  assert.equal(args.filter((a) => a === '-t').length, 1);
  assert.ok(!args.some((a) => /terminal|file|coding/.test(a)));
});

// cliErrorDetail (issue 1fa461a): a timeout kill must say so, even when stderr holds only the
// resume banner Hermes printed before it was killed.
test('cliErrorDetail — a kill names the timeout first, keeps stderr', () => {
  const killed = Object.assign(new Error('Command failed'), { killed: true });
  assert.equal(
    cliErrorDetail(killed, '↻ Session reprise local-abc\n', 150000),
    'Délai dépassé (150 s)\n↻ Session reprise local-abc\n'
  );
});

test('cliErrorDetail — a kill with empty stderr falls back to the error message', () => {
  const killed = Object.assign(new Error('Command failed'), { killed: true });
  assert.equal(cliErrorDetail(killed, '', 150000), 'Délai dépassé (150 s)\nCommand failed');
});

test('cliErrorDetail — any other failure is stderr unchanged', () => {
  const failed = Object.assign(new Error('Command failed'), { killed: false, code: 1 });
  assert.equal(cliErrorDetail(failed, 'boom\n', 150000), 'boom\n');
});
