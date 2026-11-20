---
artifact_type: change_boundary
task_id: watchdog-restart-reset
timestamp: 2026-06-24T11:32:59Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| hermes_watchdog.sh | Reset RESTART_COUNT on the healthy-check branch so escalation counts consecutive failures, not lifetime | modify |
| SESSION_LOG.md | Framework Session Journal (Pre/Post-Flight) for this STANDARD task | create |
| .artifacts/watchdog-restart-reset/pre_computation_block.md | Skill A artifact | create |
| .artifacts/watchdog-restart-reset/simplicity_review.md | Skill B artifact | create |
| .artifacts/watchdog-restart-reset/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/watchdog-restart-reset/verification_matrix.md | Skill D artifact | create |
| .artifacts/watchdog-restart-reset/adherence_report.md | Review-gate output | create |
| METRICS.md | Aggregated metrics rollup | create |

## Out-of-Bound List
- README.md — already documents "5 redémarrages consécutifs"; the fix makes the
  code match it, so the doc needs no edit.
- start_after_reboot.sh — boot orchestration, unrelated.
- manage_hermes.sh — start/stop wrapper, does not own the counter.
- hermes-discord-bot-clean.js — bot logic, different concern.

## Orthogonal Issues (noticed, skipped)
- The watchdog process is itself unsupervised (started via `nohup ... &` in
  start_after_reboot.sh). If it dies, nothing restarts it. Fixing this means
  supervising it (systemd) or retiring it in favour of `pm2 startup systemd` —
  a deployment-model change needing VPS access. Recommend a dedicated issue.
- MAX_RESTARTS (5) and the 60s poll interval are hardcoded — could be env-driven.
- hermes_watchdog.log has no rotation — unbounded growth over time.

## Orphan Tracking
- None — no variable, function, or include becomes unused. RESTART_COUNT,
  MAX_RESTARTS, check_hermes, and start_hermes all remain in use.
