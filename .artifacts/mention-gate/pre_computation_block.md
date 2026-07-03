---
artifact_type: pre_computation_block
task_id: mention-gate
timestamp: 2026-07-03T18:06:27Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `message.mentions.has(id)` with DEFAULT options returns true for @everyone/@here (`this.everyone`), a reply to the bot (`userWasRepliedTo`), and a role the bot holds — not just a direct @mention. Confirmed by reading the installed discord.js 14.26.4 MessageMentions.has() source. | HIGH |
| 2 | Line 155's `isMentioned` is the ONLY handler path that can respond to plain text: the auto-link path (line 369) needs a URL match and recap needs `isMentioned` + HISTORY_PATTERN, so a no-link/no-mention/no-DM message reaching a response must have passed line 165 via `isMentioned`. | HIGH |
| 3 | A genuine @mention always places the bot's `<@id>` / `<@!id>` token in `message.content` — the same token the handler already strips at lines 178-182 — so a content regex is a faithful "direct mention" test. Replies/@everyone/role-pings do NOT put that token in content. | HIGH |
| 4 | Reply-to-bot conversation-continuation was never an intended feature; it was a side-effect of has() defaults. Restricting to explicit @mention + DM matches the documented behaviour ("answers @mentions and DMs") and the user's complaint. | MEDIUM |
| 5 | The gate line is unchanged since the initial commit (git blame), so this is a usage change (people now reply to the bot's new summaries), not a recent code regression — and the fix must ship as a code change; no redeploy of an old build helps. | HIGH |

## Scope Declaration
### Files in scope
- text.js — add pure `mentionsUser(content, userId)` helper + export it
- hermes-discord-bot-clean.js — import mentionsUser; replace `message.mentions.has(client.user.id)` at the gate with `mentionsUser(message.content, client.user.id)`
- test/text.test.js — unit tests for mentionsUser (direct mention true; plain/@everyone/@here/other-user/substring-id/empty false)

### Files off-limits
- The mention-STRIP loop (entrypoint lines 178-182) — it already strips `<@!?id>` for all mentioned users; correct as-is, and changing it is out of scope
- recap.js / prompts.js / hermes-cli.js / cache.js / config.js — no mention-gate surface
- The auto-link path (entrypoint 367+) — a separate trigger, not implicated

## Interpretations of the request
- "bot triggers on every sentence" = the @mention gate is firing on non-mentions (replies to the bot and/or @everyone/@here), so restrict it to a real, typed @mention
- The fix must NOT break: genuine @mentions (still answer Q&A/summaries) and DMs (admin path)

## Alternatives considered
- `message.mentions.has(id, { ignoreEveryone: true, ignoreRoles: true, ignoreRepliedUser: true })` — correct and one line, but not unit-testable without mocking a discord.js Message; rejected in favour of the pure, testable helper (the gate is critical-path and deserves a regression test)
- Keep reply-to-bot as a trigger, only drop @everyone/roles — rejected: reply-triggering is the likely dominant cause of the complaint and was never intended; add reply-continuation deliberately later if wanted
- Inline the regex at line 155 — rejected: an untestable one-off in the Discord entrypoint; the helper is reused-shaped and locks behaviour with tests

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | read discord.js MessageMentions.has() source | everyone/repliedUser/roles counted by default | confirmed (lines with `this.everyone`, `userWasRepliedTo`, `!ignoreRoles`) | 2026-07-03T18:06:27Z | PASS |
| 2 | `node -e` mentionsUser('hi <@42>','42') / ('just talking','42') | true / false | true / false | 2026-07-03T18:06:27Z | PASS |
| 3 | `git log -L 155,155:hermes-discord-bot-clean.js` | gate unchanged since initial commit | isMentioned line traces to 076f6d0 | 2026-07-03T18:06:27Z | PASS |
