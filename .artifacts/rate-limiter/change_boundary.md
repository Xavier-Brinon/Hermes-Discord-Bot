---
artifact_type: change_boundary
task_id: rate-limiter
timestamp: 2026-11-23T21:25:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `rate-limit.js` | Pure concurrency + per-user sliding-window limiter | create |
| `config.js` | Rate/concurrency defaults and French busy/rate-limited messages | modify |
| `hermes-discord-bot-clean.js` | Acquire/release limiter slots around recap, Q&A, and `📝` summaries | modify |
| `test/rate-limit.test.js` | Unit tests for concurrency cap, per-user window, expiry, admin bypass, release on error | create |
| `test/modules.test.js` | Smoke test for `rate-limit.js` and new `config.js` constants | modify |
| `SESSION_LOG.md` | Pre-/Post-Flight journal entry | modify |
| `METRICS.md` | Regenerated adherence rollup | modify |
| `.artifacts/rate-limiter/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/rate-limiter/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/rate-limiter/change_boundary.md` | Skill C artifact | create |
| `.artifacts/rate-limiter/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/rate-limiter/adherence_report.md` | Review Gate report | create |

## Out-of-Bound List
- `hermes-cli.js` — CLI wrapper remains decoupled from Discord users.
- `cache.js` — transient limiter state stays in memory.
- `package.json` — zero new dependencies.

## Orthogonal Issues (noticed, skipped)
- Unused `axios` and `dotenv` in `package.json` — tracked in ticket `20261123T200856`.

## Orphan Tracking
- None expected.
