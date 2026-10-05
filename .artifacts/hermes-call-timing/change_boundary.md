---
artifact_type: change_boundary
task_id: hermes-call-timing
timestamp: 2026-10-05T10:14:51Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Change type |
| ---- | --- | ----------- |
| `hermes-cli.js` | formatTimingLine + one line per exit path + `flow` option | modify |
| `hermes-discord-bot-clean.js` | recap passes `flow: 'recap'` | modify |
| `test/hermes-cli.test.js` | formatTimingLine tests | modify |
| `README.md` | §Health check percentile command | modify |

## Out-of-Bound List

| Path | Reason deferred |
| ---- | --------------- |
| `config.js` | timeouts unchanged |
| `prompts.js`, `text.js`, `youtube.js`, `cache.js`, `recap.js` | unrelated |

## Invariants that must survive the diff
- Every existing log line stays as it is.
- No Discord-facing text changes.
- Each askHermes / runLinkSummary exit path logs exactly one ⏱️ line.
