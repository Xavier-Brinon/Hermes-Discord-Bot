---
artifact_type: adherence_report
task_id: max-turns-cap
timestamp: 2026-08-14T14:12:14Z
complexity_score: 5
complexity_tier: STANDARD
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D  (STANDARD — all four, per orchestrator tier mapping for score 5)

## Artifacts produced
- pre_computation_block: .artifacts/max-turns-cap/pre_computation_block.md
- simplicity_review: .artifacts/max-turns-cap/simplicity_review.md
- change_boundary: .artifacts/max-turns-cap/change_boundary.md
- verification_matrix: .artifacts/max-turns-cap/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     1 | **Simplify Trigger FIRED** — Line-Count Budget Target 20, Actual 56 (+180%). Recorded, diagnosed and re-planned to 50 (+12%) in `simplicity_review.md`. Not disguised creep: 10 of the 20 hermes-cli.js lines are array elements Prettier exploded when 2 new ones pushed a one-line literal past the print width, and 31 are 4 `test()` blocks against a Target of 9 that could never hold them. Every Abstinence List item is still absent from the diff. |
| Scope Bleed      |     0 | Only the 4 declared code files changed (`config.js`, `prompts.js`, `hermes-cli.js`, `test/prompts.test.js`) plus the declared process records. `hermes-discord-bot-clean.js` untouched — the ⚠️ marker falls out of the existing `abstained` computation for free. `recap.js`, `text.js`, `cache.js`, `evals/` and all docs untouched. |
| Style Drift      |     0 | The notice filter mirrors the existing `READING_TRACE` line-filter idiom inside the same function rather than inventing a mechanism; the abstain early-return sits beside the existing sentinel abstention and reuses `messagesFR.linkUnreadable`. eslint 0 problems, prettier clean. |

## Metrics
- Reflex Rate: PASS (Post-Flight Reflex Audit passed; the diff matches the Pre-Flight commitment item for item, and the one deviation — the budget overage — is recorded with a Simplify Trigger rather than hidden)
- Scope Adherence: 100%

## Verification summary
- 11 of 12 Verification Matrix rows PASS; the 1 PENDING (issue lifecycle) lands at merge.
- Driven end-to-end against verbatim stdout captured from a real `--max-turns` exhaustion: the
  predicate fires, the notice never reaches the parsed response, and Discord receives
  `messagesFR.linkUnreadable` — the French abstention, no English control text.
- `npm test` 90/90 (was 86; +4 new). `npx eslint .` 0 problems. `npx prettier --check .` clean.
- Return shape of `parseHermesOutput` unchanged, so all 3 `assert.deepEqual` contracts still pass.
- Residual risk: the notice wording was captured on v0.20.0 while the bot runs v0.16.0. Matching is
  tolerant and a non-match degrades to today's behaviour, not to a failure. Flagged at handover.
