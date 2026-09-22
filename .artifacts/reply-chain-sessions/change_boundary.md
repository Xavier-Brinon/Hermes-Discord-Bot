---
artifact_type: change_boundary
task_id: reply-chain-sessions
timestamp: 2026-09-22T18:36:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `cache.js` | reply-chain session keys + cap | modify |
| `text.js` | sendLongResponse returns posted messages | modify |
| `hermes-discord-bot-clean.js` | Q&A path: findSessionId / recordSession | modify |
| `test/cache.test.js` | new unit tests | create |
| `test/modules.test.js` | cache export list | modify |
| `test/text.test.js` | sendLongResponse return value | modify |
| `.artifacts/reply-chain-sessions/pre_computation_block.md` | framework artifact | create |
| `.artifacts/reply-chain-sessions/simplicity_review.md` | framework artifact | create |
| `.artifacts/reply-chain-sessions/change_boundary.md` | framework artifact | create |
| `.artifacts/reply-chain-sessions/verification_matrix.md` | framework artifact | create |
| `.artifacts/reply-chain-sessions/adherence_report.md` | framework artifact | create |
| `CONTEXT.md` | **declared scope addition at Post-Flight** — Session glossary entry said "cached per channel/thread" | modify |
| `hermes-discord-bot.md` | **declared scope addition at Post-Flight** — same stale "per channel/thread" wording | modify |
| `SESSION_LOG.md` | Pre-/Post-Flight | modify |
| `METRICS.md` | regenerated rollup | modify |

## Out-of-Bound List
- `prompts.js`, `hermes-cli.js`, `recap.js`, `config.js`, `youtube.js`
- the link cache in `cache.js`
- the 📝 summary path in `hermes-discord-bot-clean.js`

## Orthogonal Issues (noticed, skipped)
- **DMs likely crash at the guild check.** `isDirectMessage = message.channel.type === 'DM'` compares against a v13 string; in discord.js v14 `type` is the numeric `ChannelType.DM` (1), so `isDirectMessage` is always false and `message.guild.id` throws on a DM (guild is null). **Verified at Post-Flight:** `require("discord.js").ChannelType.DM === 1` (number); the same stale comparison also appears at :382 and :484 (admin-DM channel name). Reported to the user as a separate issue, not fixed here. Consequence for this task: the DM branch of `placeKey` is correct but unreachable in production until that bug is fixed.

## Orphan Tracking
- None. `getSessionKey`, `getSessionId`, `setSessionId` were removed; `grep -rn` over the repo (excluding records) finds no remaining reader. `MAX_SESSIONS` is exported for the cap test only, consumed by test/cache.test.js.
