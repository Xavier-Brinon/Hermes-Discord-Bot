---
artifact_type: adherence_report
task_id: reply-to-bot
timestamp: 2026-07-03T19:05:16Z
complexity_score: 3
complexity_tier: STANDARD
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D

## Artifacts produced
- pre_computation_block: .artifacts/reply-to-bot/pre_computation_block.md
- simplicity_review: .artifacts/reply-to-bot/simplicity_review.md
- change_boundary: .artifacts/reply-to-bot/change_boundary.md
- verification_matrix: .artifacts/reply-to-bot/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     0 | One 1-line predicate OR-ed into the gate (2 logical LOC vs 3 target). No fetch, no new event. |
| Scope Bleed      |     0 | Only text.js + hermes-discord-bot-clean.js + test/text.test.js changed — all on the Touch List. Prettier touched only my added lines. |
| Style Drift      |     0 | isReplyTo mirrors the pure-helper style of mentionsUser; eslint 0 errors (4 pre-existing warnings untouched); prettier clean. |

## Metrics
- Reflex Rate: PASS
- Scope Adherence: 100%

<!-- Reviewer notes (self-review):
- Follow-up to f482c08: the user wants replies to the bot to count as a mention (continue a conversation without re-typing @Bot). f482c08 made the gate content-only, which had dropped reply-to-bot along with the noise.
- Fix: pure isReplyTo(message, userId) = message?.mentions?.repliedUser?.id === userId, OR-ed into isMentioned. discord.js sets repliedUser to the replied-to author for ANY reply and ONLY for replies (confirmed from source), so this adds bot-replies precisely — @everyone/@here, roles, plain messages, and replies to other people still don't trigger (f482c08 holds).
- Tests (4 new, 70/70): reply-to-BOT true; reply-to-other false; non-reply false; missing-shape false (no throw).
- Not deployed yet: prod is 089cc4b (or fb0ee92 if the user redeployed); this ships on the next VPS pull + restart.
- Issue lifecycle comment on 92b16a6 to be posted before state --solved (patch ID + merge SHA + verification).
-->
