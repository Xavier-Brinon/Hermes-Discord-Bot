---
artifact_type: pre_computation_block
task_id: prompt-eval-harness
timestamp: 2026-06-24T17:08:48Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Extracting each prompt verbatim (no shared sub-constants) guarantees byte-identical output vs the current inline literals | HIGH |
| 2 | The recap path sends `buildAskPrompt(buildRecapPrompt(), context)` (nested), NOT the recap string raw — so the eval must reproduce that nesting | HIGH |
| 3 | `require('./prompts')` is safe in the bot: prompts.js is a pure module with no side effects at load | HIGH |
| 4 | The eval faithfully tests the PROMPT by invoking `hermes -p discord-bot` with the bot's exact args; output-extraction parity (unwrap) is approximated here and fully converges when dcdec9e lands | MEDIUM |
| 5 | `extractThemes` moved verbatim preserves the parser behaviour at :711-719 | HIGH |

## Verifications
| # | Check | Expected | Actual | Timestamp | Verdict |
|---|-------|----------|--------|-----------|---------|
| 1 | `npm test` byte-identity assertions | all PASS | 8/8 pass | 2026-06-24T17:11:00Z | PASS |
| 2 | `node --check hermes-discord-bot-clean.js` and `node --check prompts.js` | exit 0 | exit 0 | 2026-06-24T17:11:00Z | PASS |
| 3 | `node --check evals/run-recap-eval.js evals/assertions.js` | exit 0 | exit 0 | 2026-06-24T17:11:00Z | PASS |

## Scope Declaration
### Files in scope
- `prompts.js` — new single source for the 3 prompts + `extractThemes`.
- `hermes-discord-bot-clean.js` — import from prompts.js; replace 3 inline prompts + inline theme parse with calls (behaviour-preserving).
- `test/prompts.test.js` — deterministic unit tests (byte-identity + parser).
- `evals/assertions.js`, `evals/run-recap-eval.js` — prompt-eval harness.
- `evals/fixtures/recap/*.txt`, `evals/README.md` — fixtures + usage.
- `package.json` — add `test` script.

### Files off-limits
- `hermes_watchdog.sh`, `manage_hermes.sh`, `start_after_reboot.sh` — deployment, unrelated.
- The Hermes output extraction / `unwrapText` (:218-242, :326-362) — extracting that is issue dcdec9e; not this task.
- `CLAUDE.md`, `README.md` — no doc change needed for this addition.

## Interpretations of the request
- Primary: make the prompts testable/steerable, with the recap as the worked
  example (the user's explicit "e.g. how to stir the recap").
- The eval optimises a measurable signal (THEME-format compliance rate), not a
  single pass/fail, because LLM output is non-deterministic.

## Alternatives considered
- Factor a shared "réponds en français…" constant across prompts — rejected:
  risks a byte-level drift from the shipped strings and is premature abstraction
  (Skill B). Verbatim literals per function are simplest and provably identical.
- Build link + Q&A eval runners now too — rejected: scope. Recap is the explicit
  ask; assertions.js stays general so they're cheap to add later.
- Also extract `unwrapText`/`parseHermesOutput` for full output parity — rejected:
  that is issue dcdec9e. The eval approximates the `-Q` path and documents it.
