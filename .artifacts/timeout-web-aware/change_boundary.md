---
artifact_type: change_boundary
task_id: timeout-web-aware
timestamp: 2026-06-24T21:39:00Z
complexity_tier: STANDARD
complexity_score: 3
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `hermes-discord-bot-clean.js` | Replace dead `HERMES_CONFIG` with 3 named timeout constants; make `askHermes` web-aware; name recap timeout; raise `summarizeLink` to web timeout | modify |
| `.artifacts/timeout-web-aware/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/timeout-web-aware/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/timeout-web-aware/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/timeout-web-aware/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/timeout-web-aware/adherence_report.md` | Review Gate artifact | create |
| `SESSION_LOG.md` | Append Pre/Post-Flight task section | modify |
| `METRICS.md` | Tool-regenerated rollup (`aggregate-metrics.sh`) | modify |

## Out-of-Bound List
- prompts.js — prompt content, not timeout logic
- README.md — runbook states no `HERMES_CONFIG`/timeout value (grep clean); nothing to sync
- CLAUDE.md — architecture doc, no timeout numbers to update
- hermes_watchdog.sh / manage_hermes.sh / package.json — deploy harness, orthogonal
- The Hermes output parser (`⚕ Hermes`/`──` extraction in `askHermes`) — coupling point, untouched

## Orthogonal Issues (noticed, skipped)
- Low-information questions make Hermes invoke its interactive `clarify` tool, which a one-shot bot can never service — it burns time then fails, compounding timeouts. Flagged in issue dcefbc4 as its own concern; deserves a separate issue if it recurs, not this fix.
- `summarizeLink` duplicates the execFile+parse boilerplate of `askHermes` — a refactor candidate, but out of scope here.

## Orphan Tracking
- `HERMES_CONFIG` (const) — becomes fully unused; removed this commit (it is the dead object being deleted, verified single-reference via grep).
- No new unused imports/vars introduced (the 3 new constants are all consumed at the touched call sites).
