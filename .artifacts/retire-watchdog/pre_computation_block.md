---
artifact_type: pre_computation_block
task_id: retire-watchdog
timestamp: 2026-07-06T12:56:35Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The managed Hermes sandbox exposes no boot hook we control: a container restart/recreate does NOT auto-start the bot | HIGH |
| 2 | PM2 natively restarts the bot on crash, so the bash watchdog's crash-restart role is fully redundant | HIGH |
| 3 | The bash watchdog was already dead and unsupervised (its own failure mode, silent) | HIGH |
| 4 | `./manage_hermes.sh start` fully recovers the bot on a fresh container — every dependency lives on the persistent `/data` volume | HIGH |
| 5 | No init system is available; `pm2 startup`'s "upstart" detection is a false positive (PID 1 is tini, not an init daemon) | HIGH |
| 6 | Removing the two scripts changes no bot behaviour — they are ops-only, and package.json's pm2 scripts never referenced them | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `cat /proc/1/comm` (VPS) | not systemd | `tini` (entrypoint `tini -- /app/u4s-hermes-agent`) | 2026-07-06T12:10:00Z | PASS |
| 2 | `systemctl --version; pidof systemd` (VPS) | no init system | "NO systemd binary"; "systemd NOT running" | 2026-07-06T12:10:00Z | PASS |
| 3 | hostname before vs after a real recreate (VPS) | hostname changes = container cycled | `d715964579bc` → `8100849eb114` | 2026-07-06T12:34:00Z | PASS |
| 4 | `npx pm2 list` immediately after the recreate (VPS) | bot NOT auto-started | daemon spawned empty; "bot NOT in pm2" | 2026-07-06T12:34:00Z | PASS |
| 5 | `ls -la /data/workspace/hermes_watchdog.log` (VPS) | stale = watchdog dead | mtime 2026-06-25 (11 days stale) | 2026-07-06T12:00:00Z | PASS |
| 6 | `grep -rn hermes_watchdog\|start_after_reboot package.json` | no pm2-script reference | no matches | 2026-07-06T12:50:00Z | PASS |

## Scope Declaration
### Files in scope
- hermes_watchdog.sh — delete: redundant with PM2's native crash-restart, unsupervised, dead 11 days, and cannot survive a container recreate
- start_after_reboot.sh — delete: obsolete manual "run after reboot" helper; `./manage_hermes.sh start` is the recovery, and its only extra act (launching the watchdog) is being retired
- README.md — rewrite "After a reboot" + "Automatic recovery" to the honest model; drop the two scripts from the project tree; replace the "Watchdog silent" troubleshooting row + the watchdog watch-point + the watchdog-log maintenance line
- CONTEXT.md — the "The harness" glossary line names the watchdog as part of the supervision stack; correct it

### Files off-limits
- manage_hermes.sh — its `start` path (dotenvx → pm2 start → pm2 save) already IS the recovery; no change needed
- package.json — pm2 scripts never referenced the deleted files; no change
- hermes-discord-bot-clean.js and all .js modules — this is an ops/docs change; no bot code touches the watchdog
- /app/u4s-hermes-agent (the container entrypoint) — host-side, image-baked, wiped on recreate, and outside this repo; unmodifiable
- evals/, test/ — no runtime surface changes; nothing to test

## Interpretations of the request
- Primary reading: the issue asks to "supervise or retire" the watchdog and "record the decision". The VPS investigation showed supervise-via-systemd is impossible (no init system) and the watchdog is redundant + dead + cannot survive a recreate — so the decision is RETIRE, and the deliverable is deletion + honest docs.
- Two of the issue's four acceptance criteria (auto-boot after reboot; auto-restart the supervisor) are ENVIRONMENT-BLOCKED in a managed sandbox — recorded as a finding in the lifecycle comment, not silently dropped.

## Alternatives considered
- Install a systemd/upstart unit (issue's preferred fix) — rejected: PID 1 is tini, no init runs; units outside `/data` are wiped on every recreate.
- Supervise the watchdog with an init unit — rejected: same no-init wall, and it keeps redundant machinery alive.
- Add a `resurrect` subcommand + a `pm2 resurrect` boot script — rejected: no boot hook exists to invoke it, and `./manage_hermes.sh start` already recovers fully and more robustly than resurrecting a possibly-stale dump.
- Keep the watchdog, just fix its supervision — rejected: unfixable in principle here (any in-container supervisor needs something to start IT at boot; only the platform can, and it won't).
