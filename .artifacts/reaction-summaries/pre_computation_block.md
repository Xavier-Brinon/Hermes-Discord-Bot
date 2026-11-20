---
artifact_type: pre_computation_block
task_id: reaction-summaries
timestamp: 2026-07-04T07:33:11Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | discord.js 14.26.4 needs the numeric `Partials` enum, not the v13 strings; `partials: ['CHANNEL']` is inert today | HIGH |
| 2 | `GuildMessageReactions` intent + `Partials.Message`/`Partials.Reaction` are enough to receive `messageReactionAdd` on uncached (pre-restart) messages | HIGH |
| 3 | `reaction.message` after `.fetch()` is a full Message — `reply`/`react`/`reactions`/`channel`/`url`/`author`/`content` behave as in the messageCreate path | HIGH |
| 4 | The former auto-detect block only ever summarised ONE link (`String.match` on the non-global `LINK_PATTERN` returns the first match); making `extractArticleLinks` global to honour the existing "up to 3" cap is new-path-only, so no regression | HIGH |
| 5 | The feature is guild-only; a 📝 in DMs (no `message.guild`) is correctly ignored, and `DirectMessageReactions` intent is not needed | MEDIUM |

## Scope Declaration
### Files in scope
- text.js — add pure `extractArticleLinks(content)` (all article links, [] to stay silent)
- config.js — add `SUMMARY_REACTION = '📝'` constant + export
- hermes-discord-bot-clean.js — add `Partials` + `GuildMessageReactions`; fix `'CHANNEL'`; add `messageReactionAdd` handler + extracted `summariseArticleLinks`; remove the auto-detect-link block
- test/text.test.js — unit tests for `extractArticleLinks`

### Files off-limits
- hermes-cli.js — `summarizeLink` is reused unchanged; the reply flow is Discord-I/O, stays in the entrypoint
- prompts.js — summary format unchanged (reuses buildSummaryFormat via summarizeLink)
- recap.js / cache.js — unrelated; `setCachedLink` reused as-is
- the @mention/DM Q&A + recap paths in the entrypoint — untouched (only the trailing auto-detect block is removed)

## Interpretations of the request
- "reactions trigger" = issue c8dafc0: 📝 reaction opt-in summaries, and remove auto-summary-on-post so summaries are reaction-only
- "stay SILENT" = the handler returns with no reply/reaction when there is no article link (no "il n'y a pas de lien" message)
- The @mention-with-a-link summary path is explicit, not "auto", so it stays

## Alternatives considered
- Keep auto-summary AND add the reaction — rejected: the issue explicitly makes summaries opt-in only; auto-summary is what surfaced the f482c08 noise
- Put `summariseArticleLinks` in hermes-cli.js — rejected: it does Discord I/O (reactions, replies, notifyAdmin, client.user); hermes-cli.js is the pure CLI wrapper
- A generic `boundedSet()` factory shared by the messageCreate + reaction dedup — rejected: refactoring the working messageCreate dedup is scope bleed; mirror the existing FIFO instead
- Handle `DirectMessageReactions` too — rejected: feature is guild-gated; DM reactions are out of scope

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `node -e "const {Partials}=require('discord.js'); console.log(Partials.Channel,Partials.Message,Partials.Reaction)"` | three numbers | `1 3 4` | 2026-07-04T07:31:00Z | PASS |
| 2 | `node -e "const {GatewayIntentBits,Events}=require('discord.js'); console.log('GuildMessageReactions' in GatewayIntentBits, Events.MessageReactionAdd)"` | `true messageReactionAdd` | `true messageReactionAdd` | 2026-07-04T07:31:00Z | PASS |
| 3 | `node -e "console.log(require('discord.js').version)"` | `14.26.4` | `14.26.4` | 2026-07-04T07:31:00Z | PASS |
