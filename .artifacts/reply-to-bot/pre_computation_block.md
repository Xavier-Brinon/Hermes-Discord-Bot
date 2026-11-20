---
artifact_type: pre_computation_block
task_id: reply-to-bot
timestamp: 2026-07-03T19:05:16Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `message.mentions.repliedUser` is the replied-to message's author, set by discord.js for ANY reply (ping on or off) and ONLY for replies. Confirmed from the installed 14.26.4 MessageMentions source: `this.repliedUser = repliedUser ? this.client.users._add(repliedUser) : null` (from `referenced_message.author`). | HIGH |
| 2 | Therefore `repliedUser?.id === botId` counts a reply-to-the-bot as a mention while NOT firing on @everyone/@here, a role the bot holds, a plain message, or a reply to someone else — so it does not regress f482c08's noise fix. | HIGH |
| 3 | The gate `isMentioned || isDirectMessage` is the right seam: OR-ing the reply test into isMentioned routes a bot-reply through the existing Q&A path (session continuity already keyed per channel/thread), which is exactly conversation-continuation. | HIGH |

## Scope Declaration
### Files in scope
- text.js — add pure `isReplyTo(message, userId)` helper + export
- hermes-discord-bot-clean.js — import isReplyTo; OR it into the isMentioned gate
- test/text.test.js — duck-typed tests for isReplyTo (reply-to-user true; other-user/non-reply/missing false)

### Files off-limits
- mentionsUser (text.js) — unchanged; isReplyTo composes with it
- The recap / auto-link / @mention-summary paths — a bot-reply enters the same Q&A block; no path-specific change needed

## Interpretations of the request
- "replying to the bot counts as mentioning the bot" = a reply to one of the bot's messages should trigger the Q&A path, like an @mention — scoped to replies to the BOT only (not replies to other people)

## Alternatives considered
- Fetch `message.reference.messageId` and check the fetched author — rejected: an extra API round-trip per reply; repliedUser already carries the author with no fetch
- Re-introduce `message.mentions.has()` (drop the f482c08 fix) — rejected: that also re-adds @everyone/role/all-reply false positives; the point is to add ONLY reply-to-bot
- Inline `message.mentions.repliedUser?.id === client.user.id` at the gate — rejected in favour of a duck-typed-testable helper (the gate is critical-path and deserves a locked test)

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | grep repliedUser in installed MessageMentions.js | set from referenced_message author, only for replies | `this.repliedUser = repliedUser ? ... : null` | 2026-07-03T19:05:16Z | PASS |
| 2 | `npm test` isReplyTo cases | reply-to-user true; other/non-reply/missing false | 70/70 green | 2026-07-03T19:05:16Z | PASS |
