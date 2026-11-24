---
artifact_type: change_boundary
task_id: url-guard-recap-order
timestamp: 2026-11-24T11:04:10Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `recap.js` | Add pure `isRecapRequest` excluding URL messages | modify |
| `hermes-discord-bot-clean.js` | Move `findBlockedUrl` above recap branch; use `isRecapRequest`; drop unused `HISTORY_PATTERN` import | modify |
| `test/recap.test.js` | Unit tests for `isRecapRequest` | modify |
| `test/url-guard.test.js` | Regression test asserting `findBlockedUrl` precedes `isRecapRequest` and `askHermes` in entrypoint | modify |
| `test/modules.test.js` | Assert `recap.isRecapRequest` export | modify |
| `docs/postmortems/20261124T110355--run-url-guard-before-recap-routing.org` | Escape postmortem per `emacs-ops` | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal entry | modify |
| `METRICS.md` | Regenerated adherence rollup | modify |
| `.artifacts/url-guard-recap-order/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/url-guard-recap-order/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/url-guard-recap-order/change_boundary.md` | Skill C artifact | create |
| `.artifacts/url-guard-recap-order/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/url-guard-recap-order/adherence_report.md` | Review Gate report | create |

## Out-of-Bound List
- `url-guard.js` — URL/IP classification unchanged.
- `config.js` — regexes unchanged.
- `hermes-cli.js` — CLI wrapper unchanged.

## Orthogonal Issues (noticed, skipped)
- None observed.

## Orphan Tracking
- `HISTORY_PATTERN` import in `hermes-discord-bot-clean.js` — becomes unused once `isRecapRequest` handles it; remove in this commit.
