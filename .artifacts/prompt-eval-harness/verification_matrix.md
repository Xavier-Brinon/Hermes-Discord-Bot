---
artifact_type: verification_matrix
task_id: prompt-eval-harness
timestamp: 2026-06-24T17:08:48Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| Byte-identical prompts | Each builder returns a string === the current inline literal for the same args | `node --test test/prompts.test.js` byte-identity assertions PASS |
| Parser preserved | `extractThemes` returns the same themes the inline loop did (THEME: lines, trim, length>2 filter, intro lines ignored) | parser unit tests PASS |
| Bot still valid | Bot + prompts.js parse and import resolves | `node --check hermes-discord-bot-clean.js`; `node -e "require('./prompts')"` exit 0 |
| Eval harness valid | Runner + assertions parse | `node --check evals/run-recap-eval.js evals/assertions.js` exit 0 |
| Recap nesting faithful | Runner sends `buildAskPrompt(buildRecapPrompt(), context)` + `-Q`, matching the bot's `askHermes(recapPrompt, context, false, 120000, true)` | code review of runner vs hermes-discord-bot-clean.js:706 |
| Steerable | Runner accepts an alternate prompt file and reports compliance rate per variant | `--prompt` flag documented + parsed; README shows the A/B recipe |

## Outcomes
| Subtask | Outcome | Evidence |
|---------|---------|----------|
| Byte-identical prompts | PASS | `npm test` 8/8, incl. exact-match for ask/link/recap |
| Parser preserved | PASS | extractThemes tests: case-insensitive, trim, length>2 filter, [] path |
| Bot still valid | PASS | `node --check` bot 0; `node -e "require('./prompts')"` 0 |
| Eval harness valid | PASS | `node --check` runner+assertions 0; ran with a fake bin → graceful per-run errors, no crash |
| Recap nesting faithful | PASS | runner sends `buildAskPrompt(buildRecapPrompt(), context)` + `-Q`, matching :706 |
| Steerable | PASS | `--prompt FILE` parsed; README documents the A/B recipe |

Surfaced + fixed during verification: `node --test` (no path) swept up the root
`test-token.js` (matches `test-*.js`) → scoped the script to `test/*.test.js`.
End-to-end compliance RATES need the real hermes/discord-bot profile; deferred to
where hermes runs (the runner is verified to invoke it correctly).
