---
artifact_type: change_boundary
task_id: reply-to-bot
timestamp: 2026-07-03T19:05:16Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Add pure `isReplyTo(message, userId)` helper + export | modify |
| `hermes-discord-bot-clean.js` | Import isReplyTo; OR it into the isMentioned gate | modify |
| `test/text.test.js` | Duck-typed tests for isReplyTo | modify |
| .artifacts/reply-to-bot/pre_computation_block.md | Skill A artifact | create |
| .artifacts/reply-to-bot/simplicity_review.md | Skill B artifact | create |
| .artifacts/reply-to-bot/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/reply-to-bot/verification_matrix.md | Skill D artifact | create |
| .artifacts/reply-to-bot/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- mentionsUser (text.js) — unchanged; isReplyTo composes with it at the gate
- recap / auto-link / @mention-summary paths — a bot-reply enters the same Q&A block; no path-specific change
- config.js / prompts.js / hermes-cli.js / cache.js / recap.js — no gate surface

## Orthogonal Issues (noticed, skipped)
- 4 pre-existing eslint warnings in hermes-discord-bot-clean.js (unused e/_ in catch blocks) — not mine, untouched
- A bot-reply with no text hits the greeting path (`if (!content)`) — acceptable; not changing it here

## Orphan Tracking
- None — `message.mentions` is still used by the strip loop; no import/var becomes unused. isReplyTo is exported, imported, and tested.
