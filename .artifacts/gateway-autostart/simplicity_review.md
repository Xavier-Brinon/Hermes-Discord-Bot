---
artifact_type: simplicity_review
task_id: gateway-autostart
timestamp: 2026-09-23T06:38:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
A two-file gateway hook (manifest + a shim that spawns the existing start script, detached, with HERMES_* removed from its environment), an early-exit in `manage_hermes.sh start` when PM2 already runs the bot, and a one-line `install-hook` symlink.

## Abstinence List (not added, intentional)
- A supervisor/watchdog loop; retries inside the handler; polling cron.
- Health alerting (dead man's switch) — fallback only, not built.
- Logic in handler.py beyond spawning the script (Python kept to a shim per the user's TypeScript-only preference; the hook contract requires a Python file).
- Log rotation for .autostart.log — one short block per boot.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     45 |     74 |  +64% |

Breakdown: HOOK.yaml ~5, handler.py ~15, manage_hermes.sh ~+10, README ~15 net.

## Simplify Triggers (detected)
- **Line-Count Budget FIRED: Target 45, Actual 74 (+64%).** Executable content is ~28 lines (HOOK.yaml 4, handler.py 14, manage_hermes.sh +10 net) — under its share. The overage is explanation: 8 comment lines in handler.py + 3 in HOOK.yaml documenting why HERMES_* is stripped, and README +28 net for the two-Hermes-homes note, the install step and the autostart log. The budget sized README at ~15 and comments at ~0. Cut considered: dropping the README "Two Hermes homes" block — rejected, it is the single fact that makes the next person put a hook in the wrong directory. No Abstinence List item in the diff.
