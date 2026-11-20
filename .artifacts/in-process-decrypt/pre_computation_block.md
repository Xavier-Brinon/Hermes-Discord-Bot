---
artifact_type: pre_computation_block
task_id: in-process-decrypt
timestamp: 2026-11-18T15:19:53Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | `dotenvx run -- pm2 start` + `pm2 save` writes the decrypted token to `/data/.pm2/dump.pm2`. | HIGH |
| 2   | dotenvx `config()` looks for `.env.keys` next to the `.env` it is given, not in the cwd, so an absolute `.env` path works under PM2 whatever its cwd. | HIGH |
| 3   | `config({ strict: true })` throws when the private key is missing, so a broken key stops the bot at startup instead of logging in with an `encrypted:` string. | HIGH |
| 4   | `config()` does not override variables already set, like `dotenvx run`, so the hook's HERMES_* stripping keeps its meaning. | HIGH |
| 5   | After the change, the PM2 dump and `/proc/<pid>/environ` hold only the launcher's own environment (gateway or shell), which may still carry platform variables; names are checked after deploy. | MEDIUM |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | VPS: `grep -c DISCORD_BOT_TOKEN /data/.pm2/dump.pm2`; `grep -o '"DISCORD_BOT_TOKEN":"encrypted:' … \| wc -l` | > 0; 0 | 2; 0 | 2026-11-18T14:30:00Z | PASS |
| 2   | read `node_modules/@dotenvx/dotenvx/src/lib/helpers/keyResolution/keyValuesSync.js:52-58` | keys file resolved from the env file's dir | `path.resolve(path.dirname(filepath), '.env.keys')` after `process.env` | 2026-11-18T15:10:00Z | PASS |
| 3   | temp dir: `set` then `config({strict:true})`, then again without `.env.keys` | decrypts; then throws | `ok s3cret`; `threw MISSING_PRIVATE_KEY` | 2026-11-18T15:14:00Z | PASS |
| 4   | read `main.js:108` | pre-existing keys kept unless `overload` | `${key} pre-exists (protip: use --overload to override)` | 2026-11-18T15:10:00Z | PASS |
| 5   | VPS after deploy: names of env keys in dump and in `/proc/<pid>/environ` | no secret names | not run | — | PENDING |

## Scope Declaration

### Files in scope
- `load-env.js` (new): `loadEnv(envPath, processEnv)` = dotenvx `config` with `strict: true`.
- `hermes-discord-bot-clean.js`: `loadEnv()` instead of `require('dotenv').config()`; error text.
- `test-token.js`: `loadEnv()`; run as plain `node`.
- `manage_hermes.sh`, `package.json`: launch without `dotenvx run`.
- `test/load-env.test.js` (new).
- `README.md`: §Security becomes §Secrets (where each secret lives, who reads it, backup, rotation); stale `dotenvx run` launch lines.
- `ops/hermes-hooks/start-discord-bot/handler.py`: comment only ("slow `npx dotenvx`").

### Files off-limits
- `.env`: the VPS copy has local changes, a repo edit would break `git pull`. HERMES_DISCORD_TOKEN is removed by hand on the VPS.
- `package-lock.json`: `dotenv` stays a dependency (unused after this); removing it needs a lockfile change, not worth it here.
- `AGENTS.md`, `CLAUDE.md`: "dotenvx decrypts secrets at launch" stays true.
- README §Health check step 2 (`dotenvx run -- sh -c …`): a manual one-off diagnosis, not the bot launch.

## Interpretations of the request
- "No plaintext secret on disk" = the bot's own secrets (DISCORD_BOT_TOKEN, HERMES_DISCORD_TOKEN, the dotenvx private key) are out of the dump. Platform variables inherited by the launcher are checked by name and filed separately if found.

## Alternatives considered
- `DOTENV_PRIVATE_KEY` in the PM2 env: puts the master key in the dump, worse.
- PM2 ecosystem file with `filter_env`: more config surface, and still needs decryption somewhere.
- Delete secrets from process.env after login: does not change `/proc/<pid>/environ`, which is the launch snapshot.
