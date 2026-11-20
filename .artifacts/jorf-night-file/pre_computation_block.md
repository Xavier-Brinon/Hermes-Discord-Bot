---
artifact_type: pre_computation_block
task_id: jorf-night-file
timestamp: 2026-10-16T12:55:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | The night increment is the only file named `JORFSIMPLE_<YYYYMMDD>-0xxxxx.tar.gz`; midday fixes are `-1…` and evening files `-2…`. | HIGH |
| 2   | A day with no night file is a day with no JO (Monday, day after a holiday). | HIGH |
| 3   | An unnumbered décret (empty header `<NUM/>`) is an individual measure, so "keep every DECRET" from the issue text would contradict the ADR's "individual nominations are dropped". The NUM rule follows the ADR. | HIGH |
| 4   | A text whose TITREFULL ends in `(rectificatif)` corrects an earlier text and is not news. | MEDIUM |
| 5   | The production image (node:22, Debian) has GNU `tar` and full ICU (`Europe/Paris` in Intl). | MEDIUM |
| 6   | Global `fetch` (Node ≥ 18) is enough; no axios usage exists in the code even though it is a dependency. | HIGH |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | `grep -o 'JORFSIMPLE_20261015-[0-9]*' listing.html` | one `-0` file, others `-1`/`-2` | `-004729`, `-122925`, `-214025` | 2026-10-16T12:20:00Z | PASS |
| 2   | `grep 'JORFSIMPLE_20261012' listing.html` (Monday) | evening file only | `-212534` only | 2026-10-16T12:20:00Z | PASS |
| 3   | header NUM of every DECRET over 9 night files (7–16 Oct) | unnumbered = individual | 49 unnumbered, all nominations/postings/naturalisations/délégations; numbered 2026-929..959 with no gap | 2026-10-16T12:40:00Z | PASS |
| 6   | `grep -n "axios" *.js` | no usage | no match | 2026-10-16T12:45:00Z | PASS |

## Scope Declaration

### Files in scope
- `jorf.js` — new module: listing → night file → tar → parse → filter → facts + attribution.
- `test/jorf.test.js` — pure-helper tests and an offline run on the real sample.
- `test/fixtures/jorf/JORFSIMPLE_20261010-002617.tar.gz` — real DILA night file, unmodified.
- `docs/adr/0002-daily-government-recap-in-the-same-bot.org` — status proposed → accepted (user request).

### Files off-limits
- `hermes-discord-bot-clean.js` — wiring the flow in is sub-issue 2b330be (scheduler).
- `prompts.js` — the French recap prompt is sub-issue b51086a.
- `config.js` — no shared constant needed yet; the module's own URL/timeout stay local until the scheduler needs them.

## Interpretations of the request
1. **(Chosen)** A standalone module returning facts; nothing posted and nothing scheduled.
2. (Rejected) Keep every DECRET as the issue literally says: on 9 days that is 49 individual measures against 31 regulatory décrets, which contradicts the ADR.
3. (Rejected) "Missing file" returns null: the AC says an empty list, so `{ facts: [], attribution: null }`.

## Alternatives considered
- Title regex for individual measures ("portant nomination…") — rejected: open-ended list; the header NUM is structural.
- An XML parser dependency — rejected: only flat leaf fields of the header are read.
- A tar npm package — rejected: system tar via execFile, as the research note and the repo's execFile convention suggest.
- Hand-picked XML fixtures — rejected: one unmodified real tarball tests extraction and the walk too.

## Gold Standard cited
`examples/patterns/minimal-scaffold.md` (new module boundary, smallest seed), with `youtube.js` as the in-repo shape (execFile + temp dir + cleanup in `finally`).
