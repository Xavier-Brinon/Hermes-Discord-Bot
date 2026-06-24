#!/usr/bin/env node
'use strict';

// Recap prompt-eval runner.
//
// For each fixture (a channel-history transcript) it sends the EXACT payload the
// bot sends for a recap — buildAskPrompt(<recap prompt>, <fixture>) with `-Q` via
// `hermes -p discord-bot` — N times, then scores each run with the bot's own
// extractThemes (evals/assertions.js). Output is a compliance RATE, because LLM
// output is non-deterministic.
//
// Steer the recap (A/B): write a variant recap prompt to a file and pass
// `--prompt variant.txt`; compare its rates against the shipped prompt.
//
//   node evals/run-recap-eval.js [--runs N] [--prompt FILE] [--bin HERMES]
//                                [--fixtures DIR]
//
// Needs the real `hermes` binary + the `discord-bot` profile (runs wherever that
// lives — locally if installed, else on the VPS).

const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { buildAskPrompt, buildRecapPrompt } = require('../prompts');
const { recapCompliance } = require('./assertions');

function parseArgs(argv) {
  const a = { runs: 5, prompt: null, bin: process.env.HERMES_BIN || 'hermes', fixtures: path.join(__dirname, 'fixtures', 'recap') };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i + 1];
    if (argv[i] === '--runs') { a.runs = parseInt(v, 10); i++; }
    else if (argv[i] === '--prompt') { a.prompt = v; i++; }
    else if (argv[i] === '--bin') { a.bin = v; i++; }
    else if (argv[i] === '--fixtures') { a.fixtures = v; i++; }
  }
  return a;
}

function runHermes(bin, prompt) {
  // Mirror the bot's recap call: askHermes(recapPrompt, context, false, 120000, true)
  // → args [-p discord-bot chat -q <prompt> -Q], 120s timeout, no web tools.
  return new Promise((resolve) => {
    execFile(bin, ['-p', 'discord-bot', 'chat', '-q', prompt, '-Q'],
      { timeout: 120000, maxBuffer: 1024 * 1024 }, (error, stdout) => {
        if (error) { resolve({ ok: false, error: error.message, out: stdout || '' }); return; }
        // Quiet-mode output handling, mirroring the bot's `!inAnswer` branch.
        const out = (stdout || '').replace(/^Query:.*?\n\n?/s, '').trim();
        resolve({ ok: true, out });
      });
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const recapPrompt = args.prompt ? fs.readFileSync(args.prompt, 'utf-8') : buildRecapPrompt();
  const label = args.prompt ? path.basename(args.prompt) : 'shipped (buildRecapPrompt)';

  if (!fs.existsSync(args.fixtures)) { console.error(`No fixtures dir: ${args.fixtures}`); process.exit(2); }
  const files = fs.readdirSync(args.fixtures).filter((f) => f.endsWith('.txt'));
  if (files.length === 0) { console.error(`No .txt fixtures in ${args.fixtures}`); process.exit(2); }

  console.log(`Recap eval — prompt: ${label} — ${args.runs} run(s)/fixture — bin: ${args.bin}\n`);
  const rows = [];

  for (const file of files) {
    const context = fs.readFileSync(path.join(args.fixtures, file), 'utf-8');
    const payload = buildAskPrompt(recapPrompt, context); // the exact nesting the bot uses
    let parseable = 0, inRange = 0, clean = 0, french = 0, errors = 0, totalThemes = 0;

    for (let r = 0; r < args.runs; r++) {
      const res = await runHermes(args.bin, payload);
      if (!res.ok) { errors++; continue; }
      const c = recapCompliance(res.out);
      if (c.parseable) parseable++;
      if (c.countInRange) inRange++;
      if (c.noPreambleOrConclusion) clean++;
      if (c.french) french++;
      totalThemes += c.themeCount;
    }

    const ok = args.runs - errors;
    const pct = (n) => (ok ? Math.round((n / ok) * 100) : 0);
    rows.push({ file, parseable: pct(parseable), inRange: pct(inRange), clean: pct(clean), french: pct(french), meanThemes: ok ? (totalThemes / ok).toFixed(1) : '—', errors });
  }

  console.log('fixture                 parseable  3-5themes  no-preamble  french  meanThemes  errors');
  for (const r of rows) {
    console.log(
      `${r.file.padEnd(22)}  ${String(r.parseable + '%').padEnd(9)}  ${String(r.inRange + '%').padEnd(9)}  ${String(r.clean + '%').padEnd(11)}  ${String(r.french + '%').padEnd(6)}  ${String(r.meanThemes).padEnd(10)}  ${r.errors}`);
  }
}

main();
