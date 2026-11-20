---
artifact_type: pre_computation_block
task_id: child-env-allowlist
timestamp: 2026-11-18T13:56:45Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Hermes reads its model key from `$HERMES_HOME/.env` itself, so the bot's env carries no secret Hermes needs. | HIGH |
| 2   | The bot's `.env` holds no model key: only DOTENV_PUBLIC_KEY, DISCORD_BOT_TOKEN, HERMES_DISCORD_TOKEN, HERMES_HOME, ADMIN_USER_ID, ALLOWED_GUILD_ID (plus HERMES_BIN/HERMES_PROFILE on the VPS). | HIGH |
| 3   | Six execFile calls exist, none passes `env`: askHermes, runLinkSummary, probeHermes, runYtDlp, jorf tar, recap eval. No spawn/exec/fork. | HIGH |
| 4   | PATH, HOME, HERMES_HOME, locale, TZ, TMPDIR (plus proxy/CA vars when set) cover Hermes, yt-dlp and tar in the node:22 container. | MEDIUM (live check after deploy) |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | read `~/.hermes/hermes-agent/hermes_cli/env_loader.py::load_hermes_dotenv` | loads `<hermes_home>/.env` | loads Hermes env files from `hermes_home`, overriding shell exports | 2026-11-18T13:50:00Z | PASS |
| 2   | `grep -nE '^[A-Za-z_"]+=' .env \| cut -d= -f1` | no model key | 6 names, none a model key | 2026-11-18T13:45:00Z | PASS |
| 3   | `grep -n "execFile" *.js evals/*.js` | 6 call sites | 6 call sites, no `env:` option | 2026-11-18T13:45:00Z | PASS |
| 4   | live Q&A / 📝 / recap after deploy | answers as before | not run | — | PENDING |

## Scope Declaration

### Files in scope
- `child-env.js` (new): pure `childEnv(env)` allowlist.
- `hermes-cli.js`, `youtube.js`, `jorf.js`, `evals/run-recap-eval.js`: pass `env: childEnv()`.
- `test/child-env.test.js` (new): unit, real-child and source-scan tests.
- `README.md` §Security: one bullet on the allowlist.

### Files off-limits
- `hermes-discord-bot-clean.js`, `manage_hermes.sh`, `package.json`, `.env`: in-process decryption and PM2 belong to e39e496.
- `ops/hermes-hooks/`: already strips HERMES_* (1ce88f5).

## Interpretations of the request
- "Allowlisted env" = exact names plus the `LC_*` prefix, no other prefix (a `HERMES_*` prefix would pass HERMES_WEBUI_PASSWORD).

## Alternatives considered
- Denylist of known secrets: rejected by the user (any future secret leaks by default).
- One shared `env` object computed at module load: rejected, `childEnv()` per call stays testable and follows later process.env changes.
