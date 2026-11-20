---
artifact_type: pre_computation_block
task_id: reply-chain-sessions
timestamp: 2026-09-22T18:36:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Sessions are read/written in exactly one place: the @mention/DM Q&A path of `hermes-discord-bot-clean.js` (:369–:383). Recap and 📝 summaries never touch the session cache | HIGH |
| 2 | discord.js 14.26.4 exposes `message.reference.messageId` (the replied-to message) and `channel.isDMBased()` / `channel.isThread()` | HIGH |
| 3 | Answer messages posted into a thread report `channel.isThread() === true`, so recording the place key from the ANSWER's channel (not the question's) also covers a thread that `sendLongResponse` just created | HIGH |
| 4 | Legacy thread keys (`parent:thread`) keep their old format, so existing thread sessions keep resuming; legacy plain-channel keys are never looked up again and age out via the cap | HIGH |
| 5 | A cap of 500 entries is enough headroom for this server's traffic (a handful of conversations per day); replying to an evicted answer silently starts fresh | MEDIUM |
| 6 | Recording the session AFTER the answer is posted (it was recorded before) is safe: if the post fails, there is no answer anyone can reply to anyway | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -n "getSessionId\|setSessionId\|getSessionKey" *.js` | only cache.js + the bot's Q&A path | cache.js defs + bot :34–38 import, :369–:383 use | 2026-09-22T18:36:53Z | PASS |
| 2 | read `node_modules/discord.js/src/structures/{Message,BaseChannel}.js` | `reference.messageId`, `isDMBased()` present | Message.js:379 `messageId`; BaseChannel.js:138 `isDMBased()` | 2026-09-22T18:36:53Z | PASS |
| 3 | read `text.js` sendLongResponse | answer posted by reply / channel.send / thread.send | all three branches post Messages whose `.channel` is the place they landed in | 2026-09-22T18:36:53Z | PASS |
| 4 | read `cache.js` getSessionKey | thread key = `${parentId}:${id}` | identical format | 2026-09-22T18:36:53Z | PASS |
| 5 | `npm test` + `npx eslint .` | green baseline | 107/107; eslint 0 problems | 2026-09-22T18:36:53Z | PASS |

## Scope Declaration
### Files in scope
- cache.js — replace channel-keyed sessions with reply-chain keys: `findSessionId(message)`, `recordSession(sessionId, answers)`, a 500-entry FIFO cap; drop `getSessionKey`/`getSessionId`/`setSessionId`
- text.js — `sendLongResponse` returns the Message(s) it posted (today returns undefined)
- hermes-discord-bot-clean.js — Q&A path uses `findSessionId` before and `recordSession` after posting
- test/cache.test.js — new: resume-by-reply, thread/DM place fallback, fresh @mention, eviction
- test/modules.test.js — update the cache export list
- test/text.test.js — sendLongResponse return value (if a fake-message test fits the existing style)

### Files off-limits
- prompts.js, hermes-cli.js — session id plumbing (`--resume`) is unchanged; only which id is chosen changes
- recap.js, config.js, youtube.js — unrelated
- the link cache (`lastLinkPerChannel`) in cache.js — stays per-channel; that is issue 576af84's concern if at all
- the 📝 summary path — posts no session today; 576af84 will seed sessions from it
- the DM guild-restriction check (`message.channel.type === 'DM'`) — see Orthogonal Issues in change_boundary.md

## Interpretations of the request
- Primary reading (agreed with the user, option b): every reply-to-bot follow-up resumes the session of the exact answer replied to; a fresh @mention starts a new chain.
- Refinement: threads and DMs are single-conversation places where people type follow-ups without Discord's reply button — they also resume by place, otherwise option b would regress them.
- Alternate reading considered: keep channel sessions for plain @mentions and use chains only for summary questions (option a) — rejected by the user.

## Alternatives considered
- **Walk the Discord reply chain on every message to find the root, key by root** — rejected: a REST fetch per hop, and a lookup table keyed by answer id gives the same result in O(1) with no network.
- **Per-user sessions (channel:user)** — rejected: two people discussing the SAME answer should share context when they reply to it; a user switching topics would drag old context along.
- **Serialise Hermes calls per channel with a lock** — rejected: fixes the lost update but not the context mixing, and makes the second person wait.
- **LRU with timestamps / TTL** — rejected: insertion-order FIFO on a Map (same idiom as PROCESSED_MESSAGES) is enough; a re-recorded key is moved to the newest end.
