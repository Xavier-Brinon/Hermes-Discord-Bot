---
artifact_type: adherence_report
task_id: hermes-profile
timestamp: 2026-09-25T07:32:34Z
complexity_score: 4
complexity_tier: STANDARD
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D  (STANDARD)

## Artifacts produced
- pre_computation_block: .artifacts/hermes-profile/pre_computation_block.md
- change_boundary: .artifacts/hermes-profile/change_boundary.md
- simplicity_review: .artifacts/hermes-profile/simplicity_review.md
- verification_matrix: .artifacts/hermes-profile/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     0 | 76 vs 70 (+9%), under the trigger; budget set at Post-Flight. |
| Scope Bleed      |     1 | evals/README.md +1 line, undeclared (documents the in-scope eval change). Process records flagged by the tool are the known behaviour. |
| Style Drift      |     0 | Same env-overridable shape as HERMES_BIN (df0d693). |

## Metrics
- Reflex Rate: PASS
- Scope Adherence: 39% tool-computed at ef1ca1e (process records counted, known behaviour); 83% self-attested (5 of 6 touched source/doc files declared; evals/README.md undeclared).

## Verification summary
- 131/131 (+1); eslint 0; prettier clean; stub-binary argv capture for unset and set.
- Live eval on discord-bot-021 and issue lifecycle: PENDING.
