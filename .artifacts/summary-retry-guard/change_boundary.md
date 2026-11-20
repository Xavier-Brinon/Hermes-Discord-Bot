---
artifact_type: change_boundary
task_id: summary-retry-guard
timestamp: 2026-07-07T13:15:02Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `hermes-discord-bot-clean.js` | Add `SUMMARISING_MESSAGES` in-flight Set; split the handler guard into done-vs-in-flight + mark done only on success; isolate each per-link `summarizeLink` in its own try and return `true`/`false` from `summariseLinks` | modify |
| `.artifacts/summary-retry-guard/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/summary-retry-guard/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/summary-retry-guard/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/summary-retry-guard/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/summary-retry-guard/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- `hermes-cli.js` — `summarizeLink`'s throw already carries `cliStdout`/`cliStderr`/`elapsed`; the admin-DM path consumes them unchanged.
- `config.js` — no new `messagesFR` string; the pending/failure messages are reused verbatim.
- `prompts.js`, `text.js`, `recap.js`, `cache.js` — unrelated to the reaction dedup / per-link isolation.
- `test/*.test.js` — the handler lives in the non-exporting entrypoint; a unit test needs a testability refactor (below), a separate concern.
- The 4 pre-existing empty-catch eslint warnings (:139, :451, :458, :460) — issue cb42d9b.

## Orthogonal Issues (noticed, skipped)
- The `messageReactionAdd` handler and `summariseLinks` live in `hermes-discord-bot-clean.js`, which has no `module.exports` and calls `client.login` at load — so neither is unit-testable without a live Discord client. Extracting the dedup/in-flight guard into an importable module would make the invariants testable, but that is a testability refactor, not this bug fix. Verified here with an executable model of the guard (scratchpad) + static reasoning instead.
- Partial-failure admin notification: on partial success the failed link is logged to console but the admin is not DM'd (the user got a useful result). A "notify admin on partial failure too" policy is a separate enhancement.

## Orphan Tracking
- None. `SUMMARISING_MESSAGES` is consumed by the handler; `rememberReaction` / `REACTED_MESSAGES` remain in use (`rememberReaction` now fires only on success). `eslint --rule 'no-unused-vars: error'` produces no NEW unused symbol (the 4 pre-existing `_`/`e` warnings are unchanged).
