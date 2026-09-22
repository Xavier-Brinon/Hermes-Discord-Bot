---
artifact_type: change_boundary
task_id: summary-questions
timestamp: 2026-09-22T19:00:50Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `prompts.js` | format wording + splitQuestions + question helpers | modify |
| `hermes-cli.js` | summarizeLink returns the session id | modify |
| `hermes-discord-bot-clean.js` | post ❓ questions, record sessions, prefix replies | modify |
| `test/prompts.test.js` | tests | modify |
| `CONTEXT.md` | Link summary glossary (prettier re-padded the glossary table: 13 lines, whitespace only) | modify |
| `.artifacts/summary-questions/pre_computation_block.md` | framework artifact | create |
| `.artifacts/summary-questions/simplicity_review.md` | framework artifact | create |
| `.artifacts/summary-questions/change_boundary.md` | framework artifact | create |
| `.artifacts/summary-questions/verification_matrix.md` | framework artifact | create |
| `.artifacts/summary-questions/adherence_report.md` | framework artifact | create |
| `SESSION_LOG.md` | Pre-/Post-Flight | modify |
| `METRICS.md` | regenerated rollup | modify |

## Out-of-Bound List
- `text.js`, `cache.js`, `evals/`, `recap.js`, `config.js`, `youtube.js`

## Orthogonal Issues (noticed, skipped)
- The @mention path's buildAskPrompt still says "paragraphes continus (pas de sauts de ligne…)" before the appended summary format; the format's own line instructions come last and should win. Not changed (plain Q&A must stay byte-identical).
- The help check `content.includes('aide')` fires on any reply containing "aide" (e.g. "ça aide"), including replies to questions. Pre-existing.

## Orphan Tracking
- None. `summaries` now holds `{ summary, sessionId }` objects and every reader was updated (response join, abstention check). All four new prompts.js exports are consumed by the bot and tests. eslint 0 problems.
