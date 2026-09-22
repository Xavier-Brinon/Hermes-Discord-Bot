---
artifact_type: verification_matrix
task_id: reply-chain-sessions
timestamp: 2026-09-22T18:36:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 — parallel chains don't mix | replies to two different answers in one channel resolve two distinct session ids | test/cache.test.js | PASS — `two replies to two answers in one channel resume two distinct sessions` |
| AC2 — fresh @mention starts fresh | a non-reply mention in a guild channel resolves no session even after answers were recorded in that channel | test/cache.test.js | PASS — `a fresh @mention in a channel resumes nothing…` + `a reply to an unknown message…` |
| Thread/DM continuity | a non-reply message in a thread or DM resumes that place's latest session | test/cache.test.js | PASS — `a plain follow-up in a thread or DM resumes that place` |
| Long answer moved to a thread | answers posted in a new thread record the thread key, so plain follow-ups there resume | test/cache.test.js (answer.channel is a thread) | PASS — `a long answer moved into a new thread…` (also: reply to any chunk resumes) |
| Reply beats place | inside a thread, replying to an older answer resumes that answer's session, not the thread's latest | test/cache.test.js | PASS — `inside a thread, replying to an older answer beats the thread’s latest` |
| AC3 — cap + persistence | 501st entry evicts the oldest; the cache file is written | test/cache.test.js | PASS — `the map is capped…`: oldest evicted, newest kept, file holds exactly MAX_SESSIONS keys |
| sendLongResponse returns posted messages | each of its 3 branches returns the Message(s) posted | test/text.test.js | PASS — 3 new tests in test/text.test.js, one per branch |
| AC4 — recap unaffected | recap path has no session code | grep | PASS — recap block (:238–:330) has no session call; askHermes there passes no sessionId, unchanged |
| AC5 — suite + lint + format | `npm test`, `npx eslint .`, `npx prettier --check .` clean | commands | PASS — `npm test` 117/117 (was 107, +10); `npx eslint .` 0 problems; `npx prettier --check .` clean |
| Live Discord check | two members reply to two different bot answers in one channel; each follow-up answer stays on its own topic | manual, after deploy | PENDING — deploy-time |
| Issue lifecycle documented | lifecycle comment before `rad issue state --solved` | `rad issue show 244bad7` | PENDING — lands at merge |
