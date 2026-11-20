---
artifact_type: change_boundary
task_id: mention-gate
timestamp: 2026-07-03T18:06:27Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Add pure `mentionsUser(content, userId)` helper + export | modify |
| `hermes-discord-bot-clean.js` | Replace `message.mentions.has()` gate with `mentionsUser`; import it | modify |
| `test/text.test.js` | Unit tests for mentionsUser (direct-mention true; plain/@everyone/other/substring/empty false) | modify |
| .artifacts/mention-gate/pre_computation_block.md | Skill A artifact | create |
| .artifacts/mention-gate/simplicity_review.md | Skill B artifact | create |
| .artifacts/mention-gate/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/mention-gate/verification_matrix.md | Skill D artifact | create |
| .artifacts/mention-gate/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- entrypoint mention-STRIP loop (lines 178-182) — already strips `<@!?id>` correctly; detect vs strip are separate concerns
- recap.js / prompts.js / hermes-cli.js / cache.js / config.js — no mention-gate surface
- The auto-link path (entrypoint 367+) — a different trigger, not implicated in the bug

## Orthogonal Issues (noticed, skipped)
- 4 pre-existing eslint warnings in hermes-discord-bot-clean.js (unused `e`/`_` in catch blocks, lines 114/417/424/426) — not mine, not touched; same warnings the summary-format task noted
- The gate and the strip loop both hardcode the `<@!?id>` mention-token knowledge; a shared constant could dedupe, but that is a maintainability refactor, not this bug fix
- Whether reply-to-bot should be a real conversation-continuation feature — a product decision to be made deliberately, not smuggled into a bug fix

## Orphan Tracking
- None — `message.mentions` is still used by the strip loop (line 178); no import/var becomes unused. `mentionsUser` is exported, imported by the entrypoint, and covered by tests.
