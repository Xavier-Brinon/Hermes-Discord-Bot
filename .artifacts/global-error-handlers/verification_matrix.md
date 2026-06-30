---
artifact_type: verification_matrix
task_id: global-error-handlers
timestamp: 2026-06-30T20:56:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| safeReply swallows a rejected reply | A `message.reply` that throws does not propagate; returns null | `test/text.test.js`: fake message whose `reply` rejects → `await safeReply(...)` resolves to null, no throw | PASS — test green |
| safeReply returns the sent message on success | Successful reply is returned unchanged | `test/text.test.js`: fake message whose `reply` resolves to a sentinel → `safeReply` returns the sentinel | PASS — test green |
| No fire-and-forget replies remain | All `message.reply(` in entrypoint are awaited (directly or via safeReply) | `grep -n "message.reply(" hermes-discord-bot-clean.js \| grep -v await` → empty | PASS — grep returns none |
| Client/websocket errors are logged | `client.on('error')` and `client.on('shardError')` are registered | `grep -cE "client\.on\('(error\|shardError)'" hermes-discord-bot-clean.js` → 2 | PASS — count 2 |
| Process-level nets installed | `unhandledRejection` + `uncaughtException` handlers registered, do not call process.exit | `grep -cE "process\.on\('(unhandledRejection\|uncaughtException)'"` → 2; `process.exit` count unchanged at 3 (startup guards only) | PASS — 2 handlers, 0 new process.exit |
| Lint clean | `npm run lint` exits 0 (no unused vars / style drift) | `npm run lint` | PASS — 0 errors (4 pre-existing warnings untouched) |
| Tests pass | `npm test` exits 0 including new safeReply cases | `npm test` | PASS — 50 pass / 0 fail |
| Issue lifecycle documented | Comment posted before `rad issue state` recording patch ID + merge SHA + verification | `rad issue show 1ff433a` shows lifecycle comment | PENDING — lands at merge |
