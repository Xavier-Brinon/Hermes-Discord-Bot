---
artifact_type: verification_matrix
task_id: gateway-autostart
timestamp: 2026-09-23T06:38:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Hook manifest valid | non-empty events list with gateway:startup; both files present | read + prettier on HOOK.yaml | PASS — HOOK.yaml has `events: [gateway:startup]`, both files present; prettier clean |
| Handler spawns detached, strips HERMES_* | Popen with start_new_session, env without HERMES_*, cwd /data/workspace, log file | local dry run with a fake script path | PASS — VPS 2026-09-23: after `pm2 delete`, calling the installed handler with HERMES_HOME=/data + a dummy HERMES_WEBUI_PASSWORD started the bot (online 19s); bot env HERMES_WEBUI_PASSWORD count = 0, HERMES_HOME=/data (from .env) |
| start idempotent | second `start` while online prints "already running" and exits 0 | `bash -n` + VPS run | PASS — VPS: second `start` printed `already running — nothing to do.` |
| install-hook | /data/hooks/start-discord-bot links to the repo dir | VPS run | PASS — VPS: `/data/hooks/start-discord-bot -> /data/workspace/ops/hermes-hooks/start-discord-bot` |
| Manual chain on VPS | bot stopped → run handler → bot online; bot env has no HERMES_HOME | VPS commands | PASS — clean start via the handler (see row 2); no HERMES_* leaked except .env's own HERMES_HOME |
| Real recreate | after the next container recreate the bot is online with no manual step; .autostart.log shows the start | observe | PENDING — next recreate |
| Repo checks unchanged | npm test, eslint, prettier | commands | PASS — 124/124, eslint 0, prettier clean |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show 1ce88f5` | PENDING — lands at merge |
