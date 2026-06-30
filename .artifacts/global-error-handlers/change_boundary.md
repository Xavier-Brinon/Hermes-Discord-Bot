---
artifact_type: change_boundary
task_id: global-error-handlers
timestamp: 2026-06-30T20:56:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Add `safeReply` helper + export it | modify |
| `hermes-discord-bot-clean.js` | Import `safeReply`, convert 4 fire-and-forget replies, add client + process error handlers | modify |
| `test/text.test.js` | Add `safeReply` unit test (success + swallowed rejection) | modify |
| .artifacts/global-error-handlers/pre_computation_block.md | Skill A artifact | create |
| .artifacts/global-error-handlers/simplicity_review.md | Skill B artifact | create |
| .artifacts/global-error-handlers/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/global-error-handlers/verification_matrix.md | Skill D artifact | create |
| .artifacts/global-error-handlers/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- hermes-cli.js — Hermes coupling, not a Discord reply concern
- recap.js / prompts.js / cache.js / config.js — no error-handling surface in this task
- manage_hermes.sh / watchdog — supervision is open issue c226bf1, separate concern
- sendLongResponse — its `message.reply`/`thread.send` calls are already awaited under the handler's try/catch

## Orthogonal Issues (noticed, skipped)
- The two per-message `catch` blocks duplicate the "build details → notifyAdmin" block (question vs link-summary) — a `notifyFailure(message, kind, extra)` helper could DRY them, but that is a refactor, not this robustness fix
- `finalizeReaction` swallows all errors with an empty catch — acceptable (best-effort reactions), not in scope

## Orphan Tracking
- None — `safeReply` is imported and used; no symbol becomes unused (verified via `eslint .`)
