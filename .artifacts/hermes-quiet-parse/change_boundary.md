---
artifact_type: change_boundary
task_id: hermes-quiet-parse
timestamp: 2026-06-27T11:24:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `prompts.js` | Add pure parseHermesOutput parser + export | modify |
| `test/prompts.test.js` | Unit tests for parseHermesOutput against 0.17.0 fixtures | modify |
| `hermes-discord-bot-clean.js` | Add `-Q --source tool`; replace both banner loops + extractSessionId with parseHermesOutput | modify |
| .artifacts/hermes-quiet-parse/pre_computation_block.md | Skill A artifact | create |
| .artifacts/hermes-quiet-parse/simplicity_review.md | Skill B artifact | create |
| .artifacts/hermes-quiet-parse/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/hermes-quiet-parse/verification_matrix.md | Skill D artifact | create |
| .artifacts/hermes-quiet-parse/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Append Pre-/Post-Flight journal section for this task | modify |
| METRICS.md | Regenerated rollup after adherence report lands | modify |

## Out-of-Bound List
- manage_hermes.sh — no run/ops change
- README.md / CLAUDE.md — parser is a coupling point but its contract note already exists; no doc change required this task
- evals/run-recap-eval.js — recap prompt/parser contract unchanged

## Orthogonal Issues (noticed, skipped)
- Local default profile is misconfigured (ollama-cloud / empty model, HTTP 404) — local-only, not prod; not this task
- unwrapText / splitAtBoundaries still inline + untested — backlog 6115cc3, not this task

## Orphan Tracking
- extractSessionId() — becomes unused once both call sites move to parseHermesOutput; removed in this commit
- askHermes `quiet` parameter — removed (all calls are quiet now); both call sites updated
