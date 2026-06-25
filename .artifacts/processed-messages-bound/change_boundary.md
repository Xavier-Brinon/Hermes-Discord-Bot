---
artifact_type: change_boundary
task_id: processed-messages-bound
timestamp: 2026-06-25T21:05:08Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| hermes-discord-bot-clean.js | Add `MAX_PROCESSED_MESSAGES` + `rememberMessage()` helper at the declaration; swap the two `.add()` call sites to use it | modify |
| .artifacts/processed-messages-bound/pre_computation_block.md | Skill A artifact | create |
| .artifacts/processed-messages-bound/simplicity_review.md | Skill B artifact | create |
| .artifacts/processed-messages-bound/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/processed-messages-bound/verification_matrix.md | Skill D artifact | create |
| .artifacts/processed-messages-bound/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Append Pre-/Post-Flight journal section for this task | modify |
| METRICS.md | Regenerated rollup after adherence report lands | modify |

## Out-of-Bound List
- The `.has()` guard at :564 — read path is correct; only the write path leaks
- prompts.js — unrelated to dedup
- README.md / CLAUDE.md — no dedup behaviour documented
- 2f4e52a's sibling issues (df0d693 hardcoded paths, 1ff433a error handlers) — separate concerns, separate patches
- the Hermes banner parser — untouched coupling point

## Orthogonal Issues (noticed, skipped)
- `PROCESSED_MESSAGES.add` is duplicated at two call sites with identical intent — the new helper incidentally de-duplicates that, but consolidating other near-duplicate blocks (e.g. the two reply/error paths) is out of scope
- The set is module-global mutable state; a fuller refactor (issue 950dc54) would encapsulate it in a cache module — deferred to that umbrella task

## Orphan Tracking
- None — `PROCESSED_MESSAGES` stays referenced (helper + guard); no import/var becomes unused
