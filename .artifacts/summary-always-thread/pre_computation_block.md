---
artifact_type: pre_computation_block
task_id: summary-always-thread
timestamp: 2026-09-25T06:36:44Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | `message.startThread` throws `MessageExistingThread` when the message already has a thread (discord.js `Message.js:1010`, `hasThread` flag); `message.thread` reads only the channel's thread cache, so an uncached thread must be fetched via `channel.threads.fetch(message.id)` (thread id = starter message id). | HIGH |
| 2   | `splitAtBoundaries` flushes a chunk at every blank line (`text.js:123`), so a short summary must bypass it to stay one message. | HIGH |
| 3   | `postQuestions` replies to the last posted summary message, so the ❓ questions follow it into the thread and `recordSession` keys the thread's place on the summary session (`cache.js:81`). | HIGH |
| 4   | The bot has Create Public Threads in the guild's link channels — it already threads long summaries and recaps there. | HIGH |

## Scope Declaration

### Files in scope
- `text.js` — **modify**. New `postInThread`; `sendLongResponse` reuses it for the long case.
- `hermes-discord-bot-clean.js` — **modify**. `summariseLinks` always threads outside a thread/DM; caches the link on the thread too.
- `test/text.test.js`, `test/modules.test.js` — **modify**. Cover `postInThread`; export list.
- `docs/adr/0001-link-summaries-always-in-a-thread.md` — **create**. The decision.
- `CONTEXT.md` — **modify**. "Link summary" says where it is posted.

### Files off-limits
- `cache.js` — session/link caching already keyed by place; used, not changed.
- `prompts.js`, `hermes-cli.js` — summary content unchanged.
- The @mention Q&A flow — keeps length-based threading (ADR 0001, out of scope).

## Interpretations of the request
1. **(Chosen)** Every 📝 summary in a guild channel goes into a thread; thread/DM contexts stay in place (no nesting possible).
2. (Rejected) Also thread every @mention answer — the user asked about the summary; a Q&A answer is a conversation with the asker.
3. (Rejected) Post the placeholder inside a pre-created thread — a hard failure would leave an empty thread behind; the channel placeholder is deleted anyway.

## Gold Standard cited
`examples/patterns/surgical-diff.md`.
