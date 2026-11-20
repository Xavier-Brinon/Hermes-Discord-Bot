---
artifact_type: pre_computation_block
task_id: embed-anchor-summary
timestamp: 2026-07-04T14:06:25Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Discord attaches a resolved embed (title/author/provider) to a message with a YouTube/rich link, present by the time a human reacts 📝 | HIGH |
| 2 | `message.embeds[0]` exposes `.title`, `.author.name`, `.provider.name` via discord.js getters (verified) | HIGH |
| 3 | Passing the real title/author as an anchor + a verify-or-abstain instruction makes Hermes emit a sentinel instead of summarising a different video — but this is prompt-dependent, NOT provable from the local checkout | LOW |
| 4 | `buildLinkPrompt` with meta=null must stay byte-identical to today (existing prompt tests + behaviour unchanged) | HIGH |
| 5 | Discord normalises some links (youtu.be → youtube.com/watch), so embed.url may not exactly equal the posted link; a single-embed message is unambiguous, multi-embed falls back to exact-url match | MEDIUM |

## Scope Declaration
### Files in scope
- text.js — pure `extractLinkMeta(message, url)` → {title, author, provider} | null from the matching embed
- prompts.js — `LINK_UNREADABLE_SENTINEL` const; `buildLinkPrompt(url, context, meta)` gains the anchor + verify + sentinel instruction
- hermes-cli.js — `summarizeLink(url, context, meta)` threads meta; maps the sentinel → `messagesFR.linkUnreadable`
- hermes-discord-bot-clean.js — `summariseLinks` extracts meta per link and passes it
- config.js — `messagesFR.linkUnreadable` (honest French abstention)
- test/text.test.js — extractLinkMeta tests; test/prompts.test.js — buildLinkPrompt anchor/no-anchor tests

### Files off-limits
- recap.js / cache.js — unrelated
- the @mention Q&A summary path (buildAskPrompt summarize) — out of scope this task; the anchor targets the reaction/link path only
- parseHermesOutput — unchanged; sentinel detection lives in summarizeLink

## Interpretations of the request
- "use those 2 pieces of info to double-check it fetched the right content before summarising" = anchor Hermes on the embed title+author and verify-or-abstain
- decision #1 "no need" = no interim stop-gap (leave 1ff0abf live while building)
- decision #2 "confirm the failure to the user, yes" = on the sentinel, POST an honest French message (not silent)

## Alternatives considered
- Bot-side title-match guard (compare Hermes's "résumé de la vidéo « X »" line vs the embed title) — deferred: parsing-fragile; noted as a hardening follow-up if the prompt-side proves leaky
- Description-based shallow summary from the embed instead of abstaining — deferred: user framed it as a verification gate, not a metadata summary
- Stay silent on failure — rejected per decision #2 (confirm the failure to the user)
- Sentinel vs freeform honest message — chose a sentinel mapped to a controlled French message (deterministic detection, consistent wording)

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `node -e "console.log(Object.getOwnPropertyNames(require('discord.js').Embed.prototype))"` | includes title/author/provider | title, description, url, author, provider, … | 2026-07-04T14:00:00Z | PASS |
| 2 | `grep -n embed hermes-discord-bot-clean.js hermes-cli.js prompts.js` | no current embed reads | none (embeds never read today) | 2026-07-04T14:00:00Z | PASS |
