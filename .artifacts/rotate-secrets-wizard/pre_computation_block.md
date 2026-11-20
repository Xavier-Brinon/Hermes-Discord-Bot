---
artifact_type: pre_computation_block
task_id: rotate-secrets-wizard
timestamp: 2026-11-18T17:56:47Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | `dotenvx rotate` writes `.env` and `.env.keys` with `fs.promises.writeFile`, so it follows the `.env.keys` symlink and keeps the target's mode. | HIGH |
| 2   | `dotenvx set` and `rotate` take `--no-armor`, which keeps the private key local even if a dotenvx session is logged in. | HIGH |
| 3   | Only `DISCORD_BOT_TOKEN` and `HERMES_DISCORD_TOKEN` are secrets in the public `.env` history; the other names are IDs and paths. | HIGH |
| 4   | `dotenvx get NAME -f .env --strict` prints the plaintext value and fails on a missing name. | HIGH |
| 5   | `GET https://discord.com/api/v10/users/@me` with `Authorization: Bot <token>` returns 200 + the bot's username for a live token and 401 for a reset one. | MEDIUM |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | read `src/cli/actions/rotate.js:54-56`, `src/lib/helpers/fsx.js:25-27` | plain writeFile, no unlink/rename | `fsx.writeFileX` = `fs.promises.writeFile` | 2026-11-18T17:45:00Z | PASS |
| 2   | `dotenvx rotate --help`; `dotenvx set --help` | `--no-armor` listed | listed on both | 2026-11-18T17:46:00Z | PASS |
| 3   | `git log -p --all -- .env \| grep -o '^[+-][A-Z_]*='` | two token names + non-secrets | ADMIN_USER_ID, ALLOWED_GUILD_ID, DISCORD_BOT_TOKEN, DOTENV_PUBLIC_KEY, HERMES_DISCORD_TOKEN, HERMES_HOME | 2026-11-18T17:40:00Z | PASS |
| 4   | `dotenvx get --help` | `--strict`, `-f` | both listed | 2026-11-18T17:44:00Z | PASS |
| 5   | real run, stage 1 and 2 | 200 then 401 for the old token | not run | — | PENDING |

## Scope Declaration

### Files in scope
- `ops/rotate-secrets.sh` (new): the wizard.
- `README.md`: link from §Rotation.

### Files off-limits
- `.env` (VPS copy has local changes), bot source, `manage_hermes.sh`, `test-token.js`.

## Interpretations of the request
- "Use the wizard to show me how to do all that" = a `/wizard` script covering the four rotation steps I had listed, run by the user on the VPS.

## Alternatives considered
- Clipboard paste of a base64 bundle: 8 KB on one line, and the VPS terminal has broken long pastes before.
- A Node/TypeScript tool: the `/wizard` template is bash by design; the only inline code is a one-line `node -e` Discord check.
