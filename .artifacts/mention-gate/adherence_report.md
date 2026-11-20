---
artifact_type: adherence_report
task_id: mention-gate
timestamp: 2026-07-03T18:06:27Z
complexity_score: 4
complexity_tier: STANDARD
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D

## Artifacts produced
- pre_computation_block: .artifacts/mention-gate/pre_computation_block.md
- simplicity_review: .artifacts/mention-gate/simplicity_review.md
- change_boundary: .artifacts/mention-gate/change_boundary.md
- verification_matrix: .artifacts/mention-gate/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     0 | One 1-line predicate + a rewired gate (2 logical LOC vs 4 target). Reply-continuation deliberately abstained. |
| Scope Bleed      |     0 | Only text.js + hermes-discord-bot-clean.js + test/text.test.js changed — all on the Touch List. Prettier normalised only my added lines (import wraps); no whole-file reformat. |
| Style Drift      |     0 | Helper mirrors the pure-classifier style of isNonArticleUrl; eslint 0 errors (4 pre-existing warnings untouched); prettier clean on changed JS. |

## Metrics
- Reflex Rate: PASS
- Scope Adherence: 100%

<!-- Reviewer notes (self-review):
- Bug (f482c08): the bot responded to every plain sentence. Root cause = message.mentions.has(client.user.id) with default options, which per the installed discord.js 14.26.4 MessageMentions.has() source returns true for @everyone/@here (this.everyone), replies to the bot (userWasRepliedTo), and a role the bot holds — not just a direct @mention. It surfaced after the 089cc4b summary deploy made the bot post summaries people then reply to. The gate line is unchanged since the initial commit → usage change, not a code regression.
- Fix: pure mentionsUser(content, userId) in text.js that tests for the bot's typed <@id>/<@!id> token (the same token the handler strips at 178-182); used at the gate instead of has(). Drops @everyone/role/reply-to-bot false positives; genuine @mentions + DMs unaffected.
- Tests (7 new, 66/66 total): direct <@id> + <@!id> true; plain sentence, @everyone, @here, other-user, substring-id (> anchor), and empty/null/undefined all false.
- Product note: reply-to-bot conversation-continuation was never intentional (has() side-effect); deliberately not re-added. Flag to user — add deliberately later if wanted.
- Not deployed yet: prod is 089cc4b; this ships on the next VPS git pull + restart.
- Issue lifecycle comment on f482c08 to be posted before state --solved (patch ID + merge SHA + verification).
-->
