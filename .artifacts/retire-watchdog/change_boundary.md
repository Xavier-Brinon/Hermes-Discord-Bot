---
artifact_type: change_boundary
task_id: retire-watchdog
timestamp: 2026-07-06T12:56:35Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `hermes_watchdog.sh` | Redundant with PM2 crash-restart, unsupervised, dead 11 days, can't survive a recreate | delete |
| `start_after_reboot.sh` | Obsolete manual reboot helper; `./manage_hermes.sh start` is the recovery | delete |
| `README.md` | Rewrite "After a reboot" + "Automatic recovery"; drop scripts from tree; fix troubleshooting/watch-point/maintenance lines | modify |
| `CONTEXT.md` | "The harness" glossary line names the watchdog in the supervision stack | modify |
| `.artifacts/retire-watchdog/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/retire-watchdog/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/retire-watchdog/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/retire-watchdog/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/retire-watchdog/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- `manage_hermes.sh` — the `start` path (dotenvx → pm2 start → pm2 save) already is the recovery; no change needed.
- `package.json` — pm2 scripts never referenced the deleted files.
- `hermes-discord-bot-clean.js` + all .js modules (`text.js`, `recap.js`, `prompts.js`, `hermes-cli.js`, `cache.js`, `config.js`) — no bot code touches the watchdog.
- `/app/u4s-hermes-agent` (container entrypoint) — image-baked, host-side, wiped on recreate, outside the repo.
- `test/`, `evals/` — no runtime surface changed; nothing to test.

## Orthogonal Issues (noticed, skipped)
- CONTEXT.md line 17 still references `NON_ARTICLE_PATTERN`, which was deleted in issue 71e2200 — stale, but unrelated to the watchdog; belongs in its own change.
- README.md and CONTEXT.md were already prettier-dirty on HEAD (emphasis style `*x*` vs `_x_`, unpadded tables) — a whole-file `prettier --write` is a drive-by reformat; left untouched per the config.js precedent. My added table row matches the existing unpadded style.
- Full hands-off boot recovery would require a platform-side entrypoint hook (`pm2 resurrect` on container start) — outside this repo; noted in the lifecycle comment as the only path to satisfy the two environment-blocked ACs.

## Orphan Tracking
- None. No import/var becomes unused; the deleted files had no in-repo importers (only the two scripts referenced each other, and both are removed together).
