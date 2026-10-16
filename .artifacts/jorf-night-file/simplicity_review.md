---
artifact_type: simplicity_review
task_id: jorf-night-file
timestamp: 2026-10-16T12:55:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
One module of small pure functions (`parisYmd`, `nightFileName`, `parseJorfText`, `isReportable`, `filterFacts`, `attribution`) plus two thin I/O functions: `readNightFile` (system tar via execFile into a temp dir) and `fetchJorfFacts` (global fetch of the listing and the file). Regex reads of the header fields; no XML library, no tar library, no new dependency.

## Abstinence List (not added, intentional)
- XML parser / tar dependency — header fields are flat leaves; the image has tar.
- Retry on HTTP failure — the scheduler (2b330be) owns timing and retries; this module throws.
- Dedup by ID across increments — only the night file is read, so there is nothing to dedupe.
- NOTICE "Objet" extraction — not in the issue's field list; b51086a can ask for it if titles are not enough.
- Config entries in `config.js` — one caller; constants stay local until the scheduler needs them.
- Wiring into the bot — sub-issue 2b330be.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 200    | 229    | +14.5% |

jorf.js 113, test/jorf.test.js 116 (logical LOC). Target set from the issue scope (module ~100, tests ~100), recorded after the first draft (see Post-Flight deviation note).

## Simplify Triggers (detected)
- None over threshold. The test file is as large as the module because each rejection case (other nature, empty nature, unnumbered, rectificatif, article NUM leak) gets its own assertion.
