---
artifact_type: simplicity_review
task_id: watchdog-restart-reset
timestamp: 2026-06-24T11:32:59Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution

Set `RESTART_COUNT=0` on the branch where `check_hermes` reports the bot is
running. That single assignment converts the counter from a lifetime total into
a consecutive-failure count: every healthy cycle clears it, so the watchdog only
escalates to "manual intervention required" after `MAX_RESTARTS` failures in a
row — exactly what the README already documents.

## Abstinence List (not added, intentional)
- **A separate systemd unit / `pm2 startup` rewrite** — would retire the bash
  watchdog entirely but changes the deployment model and needs VPS access;
  deferred to its own issue.
- **A time-windowed failure tracker** (timestamps + sliding window) — more state
  than the spec needs; consecutive-reset is enough.
- **Making `MAX_RESTARTS` / `sleep 60` configurable via env** — a real
  improvement but a different concern; left as an orthogonal note.
- **Log-rotation for `hermes_watchdog.log`** — noticed, not this task.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      1 |      1 |    0  |

(Logical LOC; one added assignment line. A clarifying comment is non-logical.)

## Anti-Pattern contrasted
- `examples/anti-patterns/god-object.md` — the "while I'm here, let me rewrite
  the supervision stack" accretion. Explicitly avoided: this change touches only
  the counter the bug report names.

## Simplify Triggers (detected)
- None.
