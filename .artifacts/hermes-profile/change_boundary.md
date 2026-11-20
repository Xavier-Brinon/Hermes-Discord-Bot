---
artifact_type: change_boundary
task_id: hermes-profile
timestamp: 2026-09-25T07:31:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Change type |
| ---- | --- | ----------- |
| `config.js` | `HERMES_PROFILE` constant. | modify |
| `hermes-cli.js` | two `-p` sites. | modify |
| `evals/run-recap-eval.js` | eval `-p`. | modify |
| `test/modules.test.js` | export + override test. | modify |
| `README.md` | runbook. | modify |

## Out-of-Bound List

| Path | Reason deferred |
| ---- | --------------- |
| `hermes-discord-bot-clean.js` | Calls askHermes/summarizeLink; unaffected. |
| `manage_hermes.sh`, `ops/` | Env handling already correct. |
| `cache.js` | Cutover clears the session file by hand; no code. |

## Invariants that must survive the diff
- Unset env → argv byte-identical (`-p discord-bot` first, `--resume` / `-t web` splice offsets unchanged).
- `execFile`, never `exec`.
