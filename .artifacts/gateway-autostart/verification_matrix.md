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
| Handler spawns detached, strips HERMES_* | Popen with start_new_session, env without HERMES_*, cwd /data/workspace, log file | local dry run with a fake script path | PENDING — not dry-run locally: exercising it means authoring Python, which the user's rules forbid; verified on the VPS by calling the existing handler (row "Manual chain") |
| start idempotent | second `start` while online prints "already running" and exits 0 | `bash -n` + VPS run | PARTIAL — `bash -n` passes; `cd` moved before the check so `npx pm2` resolves the local pm2. Live run PENDING on the VPS |
| install-hook | /data/hooks/start-discord-bot links to the repo dir | VPS run | PENDING — VPS |
| Manual chain on VPS | bot stopped → run handler → bot online; bot env has no HERMES_HOME | VPS commands | PENDING — VPS |
| Real recreate | after the next container recreate the bot is online with no manual step; .autostart.log shows the start | observe | PENDING — next recreate |
| Repo checks unchanged | npm test, eslint, prettier | commands | PASS — 124/124, eslint 0, prettier clean |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show 1ce88f5` | PENDING — lands at merge |
