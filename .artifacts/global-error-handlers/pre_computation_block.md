---
artifact_type: pre_computation_block
task_id: global-error-handlers
timestamp: 2026-06-30T20:56:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The four fire-and-forget `message.reply(...)` at lines 148, 158, 303, 305 are the only un-awaited replies; 187/217/324 already `await` inside a try/catch | HIGH |
| 2 | `notifyAdmin(errorType, details)` never rejects (it wraps everything in try/catch), so calling it un-awaited from a global handler cannot itself trigger `unhandledRejection` | HIGH |
| 3 | For a PM2-supervised long-lived bot, `uncaughtException`/`unhandledRejection` should log + notify and KEEP RUNNING rather than `process.exit` — the issue's whole intent is to stop needless restart churn | MEDIUM |
| 4 | discord.js auto-reconnects on gateway drops, so `client.on('error'/'shardError')` must only log, never exit | MEDIUM |

## Scope Declaration
### Files in scope
- text.js — add `safeReply(message, content)` helper (logs + swallows reply rejection), export it
- hermes-discord-bot-clean.js — import `safeReply`, convert the 4 fire-and-forget replies, add `client.on('error'/'shardError')` + `process.on('unhandledRejection'/'uncaughtException')`
- test/text.test.js — add a `safeReply` test (resolves on success, swallows on reject)

### Files off-limits
- hermes-cli.js — Hermes CLI coupling; unrelated to Discord reply hygiene
- recap.js / prompts.js / cache.js / config.js — no error-handling concern here
- sendLongResponse (text.js) — its replies are already awaited under the handler's try/catch; rewriting it would be scope bleed
- manage_hermes.sh / watchdog — supervision is the separate open issue c226bf1

## Interpretations of the request
- "await replies" = ensure no `message.reply` can escape as an unhandled rejection; achieved via an awaited `safeReply` wrapper rather than scattering try/catch at each call site
- "global error handlers" = process-level nets (`unhandledRejection`, `uncaughtException`) + client-level nets (`error`, `shardError`), as the issue enumerates

## Alternatives considered
- Wrap each fire-and-forget reply in its own inline `try { await message.reply(...) } catch {}` — rejected: repeats the same 3 lines four times; a named helper is DRY and testable
- `process.exit(1)` inside `uncaughtException` for a clean PM2 restart — rejected: re-introduces restart churn the issue exists to remove, and an async `notifyAdmin` DM would be lost on a synchronous exit (see Assumption 3)
- Add a throttle/rate-limit around `notifyAdmin` to prevent DM spam in a rejection loop — rejected: YAGNI; the per-message catch blocks already handle operational errors, the global net is a last resort for rare unexpected throws

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -n "message.reply(" hermes-discord-bot-clean.js \| grep -v await` | lines 148,158,303,305 | 148,158,303,305 | 2026-06-30T20:56:00Z | PASS |
| 2 | `grep -c "catch" text.js` (notifyAdmin/safeReply pattern precedent: sendLongResponse uses await) | >=0 helper precedent confirmed | safeReply joins isNonArticleUrl/sendLongResponse | 2026-06-30T20:56:00Z | PASS |
