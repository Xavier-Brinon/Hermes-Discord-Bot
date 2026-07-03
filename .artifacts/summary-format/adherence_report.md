---
artifact_type: adherence_report
task_id: summary-format
timestamp: 2026-07-03T10:21:01Z
complexity_score: 5
complexity_tier: STANDARD
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D

(User gave explicit go-ahead for the full "both paths, adaptive" version before coding —
satisfies the COMPLEX-adjacent confirmation gate in CLAUDE.md's agent binding.)

## Artifacts produced
- pre_computation_block: .artifacts/summary-format/pre_computation_block.md
- simplicity_review: .artifacts/summary-format/simplicity_review.md
- change_boundary: .artifacts/summary-format/change_boundary.md
- verification_matrix: .artifacts/summary-format/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     0 | Format lives in one shared function reused by both paths; no module, classifier, or config knob. ~26 logical LOC vs 28 target. |
| Scope Bleed      |     0 | All changed files are on the Touch List. buildAskPromptWithContextFile / summarizeLink / config / text / cache / recap left untouched. |
| Style Drift      |     0 | New code follows existing prompt-builder style. Prettier normalised pre-existing JS drift in touched files (kept, per precedent). Markdown drift is pre-existing + ungated (eslint only) — docs left surgical, not whole-file reformatted. |

## Metrics
- Reflex Rate: PASS
- Scope Adherence: 100%

<!-- Reviewer notes (self-review):
- Goal: make the emergent "Voici un résumé… / Thèse centrale / Arguments clés / Questions" format systematic and IN OUR CONTROL (it was model/discord-bot-profile driven, not in the repo). Encoded as buildSummaryFormat() in prompts.js (source of truth shared with evals).
- Both paths: buildLinkPrompt (bare-link auto-summary) uses it directly; buildAskPrompt gains a `summarize` flag appended when the @mention carries a URL (entrypoint wantsSummary), so @mentioned links match. Plain Q&A is byte-identical (summarize defaults false) — verified.
- Adaptive labels (Thèse/Idée, Arguments/Points) so neutral news isn't forced to invent a thesis.
- Coupling updated: prompts.test.js byte-identity + new cases (56/56); evals hasLinkStructure re-keyed to Thèse/Idée + Questions; CONTEXT.md + hermes-discord-bot.md descriptions.
- Verification: node spot-checks (plain unchanged=true, summarize appends=true, linkPrompt uses format=true, hasLinkStructure true/false); npm test 56/56; eslint 0 errors (4 pre-existing warnings untouched); prettier clean on changed JS.
- Known tradeoff (documented on the issue): a pointed question carrying a URL also gets the format. Mild; refine later if noisy.
- Issue lifecycle comment on ec634229 posted before state --solved (patch ID + merge SHA + verification).
-->
