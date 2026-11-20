---
artifact_type: verification_matrix
task_id: watchdog-restart-reset
timestamp: 2026-06-24T11:32:59Z
complexity_score: 4
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| Reset on healthy check | `RESTART_COUNT=0` is set inside the `if check_hermes` (success) branch | `grep -A2 'if check_hermes' hermes_watchdog.sh` shows the reset |
| Consecutive semantics | After a healthy cycle, the next failure starts the count at 1, not at the prior lifetime total | Static review: success branch resets; only the else branch increments (single increment site) |
| Script stays valid | `bash -n hermes_watchdog.sh` exits 0 | run `bash -n hermes_watchdog.sh` |
| Surgical scope | Only the reset (and its comment) is added; start_hermes/check_hermes/MAX_RESTARTS/loop unchanged | `git diff hermes_watchdog.sh` shows only the added reset line + comment |

## Outcomes
| Subtask | Outcome | Evidence |
|---------|---------|----------|
| Reset on healthy check | PASS | `grep -A2 'if check_hermes; then'` shows `RESTART_COUNT=0` on the then-branch |
| Consecutive semantics | PASS | single increment site (`grep -cF 'RESTART_COUNT=$((RESTART_COUNT + 1))'` = 1); reset clears it each healthy cycle |
| Script stays valid | PASS | `bash -n hermes_watchdog.sh` → exit 0 |
| Surgical scope | PASS | `git diff --stat` → 1 file, 1 insertion |

End-to-end "survives crash + reboot on the VPS" is verified by reasoning +
static check here; true on-host validation is deferred to the next VPS deploy
(no VPS access from this environment). Recorded honestly, not asserted as PASS.
