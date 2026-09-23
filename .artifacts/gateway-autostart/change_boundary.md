---
artifact_type: change_boundary
task_id: gateway-autostart
timestamp: 2026-09-23T06:38:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `ops/hermes-hooks/start-discord-bot/HOOK.yaml` | gateway:startup subscription | create |
| `ops/hermes-hooks/start-discord-bot/handler.py` | spawn manage_hermes.sh start | create |
| `manage_hermes.sh` | idempotent start + install-hook | modify |
| `README.md` | runbook | modify |
| `.artifacts/gateway-autostart/pre_computation_block.md` | framework artifact | create |
| `.artifacts/gateway-autostart/simplicity_review.md` | framework artifact | create |
| `.artifacts/gateway-autostart/change_boundary.md` | framework artifact | create |
| `.artifacts/gateway-autostart/verification_matrix.md` | framework artifact | create |
| `.artifacts/gateway-autostart/adherence_report.md` | framework artifact | create |
| `SESSION_LOG.md` | Pre-/Post-Flight | modify |
| `METRICS.md` | regenerated rollup | modify |

## Out-of-Bound List
- every `*.js` source file, `test/`, `evals/`, `package.json`

## Orthogonal Issues (noticed, skipped)
- HERMES_WEBUI_PASSWORD was printed into the session transcript during investigation — user advised to rotate; not a code change.
- The interactive shell and the platform gateway use different Hermes homes (/data/.hermes vs /data); any future hermes-CLI config meant for the gateway must set HERMES_HOME=/data.

## Orphan Tracking
- None. The old manual-only runbook text was replaced, not left alongside; the troubleshooting row now points at .autostart.log first. `.autostart.log` is covered by the existing `*.log` gitignore rule.
- Noticed, not changed: README troubleshooting suggests `npx dotenvx get DISCORD_BOT_TOKEN`, which prints the token in plain text — same class of leak the user asked about; worth a follow-up.
