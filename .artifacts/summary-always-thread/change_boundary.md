---
artifact_type: change_boundary
task_id: summary-always-thread
timestamp: 2026-09-25T06:36:44Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Change type |
| ---- | --- | ----------- |
| `text.js` | `postInThread` helper; `sendLongResponse` delegates its long case. | modify |
| `hermes-discord-bot-clean.js` | `summariseLinks` posting branch + thread link cache. | modify |
| `test/text.test.js` | `postInThread` cases. | modify |
| `test/modules.test.js` | export list. | modify |
| `docs/adr/0001-link-summaries-always-in-a-thread.md` | the decision. | create |
| `CONTEXT.md` | glossary line for Link summary. | modify |

## Out-of-Bound List

| Path | Reason deferred |
| ---- | --------------- |
| `cache.js` | Place-keyed sessions already cover a thread. |
| `prompts.js`, `hermes-cli.js`, `config.js` | Content and limits unchanged. |
| `recap.js`, `evals/` | Different flow / summary structure unchanged. |

## Invariants that must survive the diff
- `sendLongResponse` behaviour byte-identical: short → one reply; long → chunks in the thread/DM or a new thread.
- Hard-failure path unchanged: placeholder deleted, ❌, admin DM, no channel reply.
- 📝 in a thread or DM with a short summary still edits the placeholder in place.
