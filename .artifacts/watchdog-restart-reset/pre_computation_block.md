---
artifact_type: pre_computation_block
task_id: watchdog-restart-reset
timestamp: 2026-06-24T11:32:59Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The README's "5 redémarrages consécutifs" (line 62) is the intended spec; the code's lifetime counter is the defect | HIGH |
| 2 | `check_hermes` returning 0 means the bot is healthy this cycle, so the consecutive-failure counter should reset on that branch | HIGH |
| 3 | `RESTART_COUNT` is incremented in exactly one place (the else branch); resetting it in the success branch is sufficient | HIGH |
| 4 | The "watchdog process is itself unsupervised" sub-problem needs VPS/systemd work and is out of scope for this in-repo counter fix | MEDIUM |
| 5 | The VPS `bash` supports the arithmetic already used in the script (no new syntax introduced) | HIGH |

## Verifications
| # | Check | Expected | Actual | Timestamp | Verdict |
|---|-------|----------|--------|-----------|---------|
| 1 | `grep -c 'RESTART_COUNT=$((RESTART_COUNT + 1))' hermes_watchdog.sh` | `1` (single increment site, supports assumption 3) | 1 | 2026-06-24T11:32:59Z | PASS |
| 2 | `bash -n hermes_watchdog.sh` after edit | exit 0, no syntax error (assumption 5) | exit 0 | 2026-06-24T11:33:30Z | PASS |

## Scope Declaration
### Files in scope
- `hermes_watchdog.sh` — add a counter reset on the healthy-check branch.

### Files off-limits
- `README.md` — already documents the intended "consécutifs" semantics; no change needed.
- `start_after_reboot.sh` — boot orchestration; unrelated to the counter bug.
- `manage_hermes.sh` — start/stop wrapper; does not own the counter.
- `hermes-discord-bot-clean.js` — bot code; out of this concern entirely.
- `package.json` / lockfile — no dependency change.

## Interpretations of the request
- Primary: fix the counter so the watchdog gives up only after N *consecutive*
  failed restarts (matching the README), not N lifetime restarts.
- Alternate reading considered: "replace the watchdog with PM2/systemd
  supervision." Plausible from the issue's "Preferred" note, but that is a
  deployment-model change requiring VPS access — treated as a separate issue.

## Alternatives considered
- Replace the bash watchdog with `pm2 startup systemd` (delete the watchdog) —
  rejected here: changes the supervision model, requires running `pm2 startup`
  on the VPS to generate/install a systemd unit, and cannot be verified from the
  repo. Recorded as an orthogonal issue.
- Time-windowed rate limit (e.g. N restarts per hour) — rejected: introduces a
  timestamp-tracking state machine the spec does not call for; consecutive-reset
  matches the documented behaviour exactly with one line.
- Reset the counter on a periodic timer — rejected: the healthy-check branch is
  the natural, simplest reset point.
