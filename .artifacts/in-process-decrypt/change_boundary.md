---
artifact_type: change_boundary
task_id: in-process-decrypt
timestamp: 2026-11-18T15:19:53Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `load-env.js` | in-process decryption, strict | create |
| `hermes-discord-bot-clean.js` | call `loadEnv()` first | modify |
| `test-token.js` | call `loadEnv()` first | modify |
| `manage_hermes.sh` | drop `dotenvx run` from start/restart | modify |
| `package.json` | drop `dotenvx run` from start and pm2 scripts | modify |
| `test/load-env.test.js` | tests | create |
| `README.md` | §Secrets runbook, launch wording | modify |
| `ops/hermes-hooks/start-discord-bot/handler.py` | stale comment | modify |

## Out-of-Bound List
- `.env`, `package-lock.json`, `AGENTS.md`, `CLAUDE.md`.

## Orthogonal Issues (noticed, skipped)
- VPS working tree: `.env` modified locally (HERMES_BIN, HERMES_PROFILE), untracked `bin/` and `ops/hermes-hooks/start-discord-bot/__pycache__/`. Not gitignored.
- `dotenv` dependency becomes unused.

## Orphan Tracking
- None.
