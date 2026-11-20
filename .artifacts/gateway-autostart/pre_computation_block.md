---
artifact_type: pre_computation_block
task_id: gateway-autostart
timestamp: 2026-09-23T06:38:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The platform's PID 1 launches `hermes gateway run` on every container start | HIGH |
| 2 | That gateway (0.20, /opt/hermes-agent) emits `gateway:startup` and loads hooks from `get_hermes_home()/hooks` = /data/hooks | HIGH |
| 3 | /data survives a container recreate (the bot's code, node_modules, .env, PM2 dump already live there) | HIGH |
| 4 | A hook subprocess inherits the gateway env incl. HERMES_HOME=/data; PM2 would pass it to the bot and its hermes 0.16 calls would use the wrong home — so HERMES_* must be stripped | HIGH |
| 5 | `Path.iterdir`/`is_dir` in hook discovery follows a symlinked hook directory | MEDIUM |
| 6 | `npx pm2 pid <name>` prints a positive pid only when the app is running | MEDIUM |
| 7 | A real recreate cannot be triggered on demand; the full chain is proven at the next recreate, the handler-to-bot half by a manual run | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `tr '\\0' ' ' < /proc/1/cmdline` + `ps --forest` (user, on VPS) | platform entrypoint spawns the gateway | `tini -- /app/u4s-hermes-agent` → `hermes gateway run` (PID 12) | 2026-09-23T06:38:53Z | PASS |
| 2 | grep `gateway:startup` + `_resolve_hooks_dir` in /opt/hermes-agent/gateway (user, on VPS) | event emitted; dir = home/hooks | run_startup.py:1245 emits; hooks.py:36 `get_hermes_home() / "hooks"` | 2026-09-23T06:38:53Z | PASS |
| 3 | README "After a reboot" + `ls -la /data/hooks` | /data persisted; hooks dir present | README documents /data as the persisted volume; /data/hooks exists, empty | 2026-09-23T06:38:53Z | PASS |
| 4 | /proc/12/environ HERMES_HOME (user, on VPS) | gateway home differs from the bot's hermes home | HERMES_HOME=/data vs the bot's /data/.hermes | 2026-09-23T06:38:53Z | PASS |
| 7 | reasoning | no on-demand recreate | managed sandbox, no control over the container lifecycle | 2026-09-23T06:38:53Z | PASS |

## Scope Declaration
### Files in scope
- ops/hermes-hooks/start-discord-bot/HOOK.yaml — new: subscribes to gateway:startup
- ops/hermes-hooks/start-discord-bot/handler.py — new: minimal shim (Python is the Hermes hook contract), fire-and-forget `manage_hermes.sh start` with HERMES_* stripped
- manage_hermes.sh — idempotent `start`; new `install-hook`
- README.md — "After a reboot" / "Automatic recovery" runbook

### Files off-limits
- all bot source (*.js), tests, evals — the bot itself is unchanged
- /data/.hermes config, the gateway's own config — nothing to configure beyond placing the hook

## Interpretations of the request
- Primary: the bot comes back on its own after a container restart/recreate.
- Alternate considered: alert-only (dead man's switch). Kept as fallback, not needed now that a boot path exists.

## Alternatives considered
- **config.yaml shell hooks** — rejected: they fire on tool/session events, not at gateway boot.
- **Hermes cron job running the start script** — rejected: cron jobs are agent runs (LLM cost per tick) and add polling; a one-shot startup event is exact.
- **~/.bashrc auto-start** — rejected as the primary: only fires when someone opens a shell.
- **Copy instead of symlink into /data/hooks** — rejected: a symlink keeps the running hook identical to the reviewed repo version after every git pull.
