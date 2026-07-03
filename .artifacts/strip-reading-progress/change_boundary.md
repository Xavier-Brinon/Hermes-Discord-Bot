---
artifact_type: change_boundary
task_id: strip-reading-progress
timestamp: 2026-07-03T14:04:43Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `prompts.js` | Add a narrow line-filter for `📄/📖 Reading` trace lines inside parseHermesOutput | modify |
| `test/prompts.test.js` | Add parseHermesOutput cases: leading strip, interleaved strip, real-answer-untouched | modify |
| .artifacts/strip-reading-progress/pre_computation_block.md | Skill A artifact | create |
| .artifacts/strip-reading-progress/simplicity_review.md | Skill B artifact | create |
| .artifacts/strip-reading-progress/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/strip-reading-progress/verification_matrix.md | Skill D artifact | create |
| .artifacts/strip-reading-progress/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- hermes-cli.js — both call sites consume parseHermesOutput's return and inherit the fix; no change needed
- text.js — `📄 Réponse détaillée` is a Discord embed field name (bot output), not Hermes trace; unrelated
- prompts.js prompt builders — the prompt strings are not the leak surface; only the parser changes

## Orthogonal Issues (noticed, skipped)
- parseHermesOutput now handles three distinct -Q leaks (⚠ diagnostics, clarify status, 📄/📖 trace) via three ad-hoc rules; a future refactor could unify them into a single "sanitise leaked -Q noise" step, but that is a maintainability task, not this bug fix (Skill C: surgical, one concern per commit)

## Orphan Tracking
- None — the change adds code; it removes no imports/vars. (No new export; module.exports unchanged.)
