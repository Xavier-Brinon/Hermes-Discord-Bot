---
artifact_type: verification_matrix
task_id: retire-watchdog
timestamp: 2026-07-06T12:56:35Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Watchdog script removed | `hermes_watchdog.sh` no longer tracked | `git status` shows `D hermes_watchdog.sh` | PASS — staged deletion (−46 LOC) |
| Reboot script removed | `start_after_reboot.sh` no longer tracked | `git status` shows `D start_after_reboot.sh` | PASS — staged deletion (−22 LOC) |
| No dangling references | nothing references the deleted files except the intentional README retirement note | `grep -rniE "hermes_watchdog\|start_after_reboot"` (excl artifacts/log) | PASS — only README's explanatory "The former `hermes_watchdog.sh`…" line remains |
| README recovery honest | "After a reboot" + "Automatic recovery" both describe PM2 crash-restart + manual `./manage_hermes.sh start` + the no-boot-hook reality | eyeball both sections | PASS — both rewritten; `manage_hermes.sh start` is the documented recovery |
| Project tree updated | tree no longer lists the two scripts | grep tree block | PASS — both lines removed |
| Troubleshooting/watch-point updated | "Watchdog silent" row + watchdog watch-point + watchdog-log maintenance line replaced | grep README | PASS — replaced with restart-count / `manage_hermes.sh` guidance |
| CONTEXT harness accurate | "The harness" glossary no longer claims a watchdog | grep CONTEXT.md | PASS — now PM2 + dotenvx, with the manual-recovery note |
| manage_hermes.sh intact | still parses; `start` recovery path unchanged | `bash -n manage_hermes.sh` | PASS — "syntax OK"; file untouched |
| No bot-behaviour regression | JS untouched → suite green, lint unchanged | `npm test`; `npx eslint .` | PASS — 86/86; eslint 0 errors (4 pre-existing warnings) |
| Decision recorded (retire vs supervise) | RETIRE decision + the two environment-blocked ACs captured with evidence | lifecycle comment on c226bf1 | PENDING — lands at merge (comment precedes state change) |
| Issue lifecycle documented | `rad issue comment` posted before `rad issue state --solved` (patch ID + merge SHA + verification) | `rad issue show c226bf1` displays the transition comment | PENDING — lands at merge |
