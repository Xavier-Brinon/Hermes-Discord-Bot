---
artifact_type: change_boundary
task_id: reaction-lifecycle
timestamp: 2026-07-07T14:59:33Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `hermes-discord-bot-clean.js` | `finalizeReaction` → `resultEmoji` param with reliable `r.me` sweep (fetch-hydrate if cache empty) + stale-clear; swap the 6 boolean call args to explicit emoji; abstention detection (⚠️ vs ✅) in `summariseLinks`; ❌ on hard error via `finalizeReaction` (deletes the manual removal loop); best-effort drop of the triggering 📝 in the `messageReactionAdd` handler | modify |
| `.artifacts/reaction-lifecycle/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/reaction-lifecycle/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/reaction-lifecycle/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/reaction-lifecycle/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/reaction-lifecycle/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- `hermes-cli.js` — `summarizeLink` already returns `messagesFR.linkUnreadable` on abstention; the entrypoint reads it unchanged.
- `config.js` — no new `messagesFR` string; ✅/⚠️/❌ are reactions, and `linkUnreadable` text already exists.
- `prompts.js`, `text.js`, `recap.js`, `cache.js` — unrelated to the reaction lifecycle.
- `test/*.test.js` — the handler/helper live in the non-exporting entrypoint (logs in on load); a unit test needs a testability refactor, a separate concern (see Orthogonal).
- The pre-existing empty-catch `no-unused-vars` warnings — issue cb42d9b owns that cleanup.

## Orthogonal Issues (noticed, skipped)
- `finalizeReaction`, `summariseLinks`, and the `messageReactionAdd` handler are in `hermes-discord-bot-clean.js`, which has no `module.exports` and calls `client.login` at load — not unit-testable without a live Discord client. Verified with an executable model of the control flow (scratchpad) + static reasoning, as the 5a8db57 task did.
- Removing only the *triggering* user's 📝 (not others') is intentional: a NEW `messageReactionAdd` re-arms the retry, and only the erroring user needs their marker cleared to re-click.
- Whether to `setCachedLink` on abstention is left unchanged (cached as before) — a follow-up question re-runs `-t web` anyway; not this issue.

## Orphan Tracking
- None. `finalizeReaction` keeps its single responsibility (now emoji-parameterised) and all 6 call sites are updated. The manual `r.me` removal loop in the `summariseLinks` catch is deleted (subsumed by `finalizeReaction('❌')`) — no dangling reference. `summariseLinks` still returns a boolean consumed by its single caller.
