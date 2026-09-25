---
artifact_type: change_boundary
task_id: delete-thread-notice
timestamp: 2026-09-25T08:03:03Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Change type |
| ---- | --- | ----------- |
| `text.js` | predicate | modify |
| `hermes-discord-bot-clean.js` | early delete branch | modify |
| `test/text.test.js` | predicate tests | modify |
| `docs/adr/0001-link-summaries-always-in-a-thread.md` | consequence line | modify |

## Out-of-Bound List

| Path | Reason deferred |
| ---- | --------------- |
| intents in the bot's Client options | already sufficient |
| `prompts.js`, `cache.js`, `hermes-cli.js`, `config.js` | unrelated |

## Invariants that must survive the diff
- Every other bot-authored message still returns early, untouched.
- A member's ThreadCreated notice is never deleted.
- A failed delete never throws out of the handler.
