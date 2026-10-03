---
artifact_type: change_boundary
task_id: glossary-org
timestamp: 2026-10-03T14:30:00Z
complexity_tier: TRIVIAL
complexity_score: 2
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `CONTEXT.md` | Glossary moves to Org | delete |
| `GLOSSARY.org` | Glossary in Org | create |
| `hermes-discord-bot.md` | Glossary reference → GLOSSARY.org | modify |
| `waysofworking.org` | Glossary reference → GLOSSARY.org | modify |
| `.artifacts/glossary-org/verification_matrix.md` | Skill artifact | create |
| `.artifacts/glossary-org/change_boundary.md` | Skill artifact | create |
| `.artifacts/glossary-org/adherence_report.md` | Review Gate | create |
| `METRICS.md` | Regenerated | modify |

## Out-of-Bound List
- All source; `templates/` (vendored Pi-YackShaving copy, mirrors the framework); `SESSION_LOG.md` and other tasks' artifacts (history).

## Orthogonal Issues (noticed, skipped)
- `templates/waysofworking.org` still says `CONTEXT.md`; it follows the Pi-YackShaving framework template.

## Orphan Tracking
- None expected.
