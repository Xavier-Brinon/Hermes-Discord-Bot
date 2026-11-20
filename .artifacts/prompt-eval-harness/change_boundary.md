---
artifact_type: change_boundary
task_id: prompt-eval-harness
timestamp: 2026-06-24T17:08:48Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| prompts.js | New single source: 3 prompt builders + extractThemes | create |
| hermes-discord-bot-clean.js | Import from prompts.js; replace 3 inline prompts + inline theme parse (behaviour-preserving) | modify |
| test/prompts.test.js | Deterministic byte-identity + parser unit tests | create |
| evals/assertions.js | Reuses extractThemes; isFrench / countQuestions / hasStructure | create |
| evals/run-recap-eval.js | Runner: hermes -p discord-bot × N runs, compliance rate, A/B | create |
| evals/fixtures/recap/multi-topic.txt | Fixture: multi-topic channel history | create |
| evals/fixtures/recap/single-topic.txt | Fixture: single-topic channel history | create |
| evals/README.md | How to run + steer + fidelity caveats + prod-log sourcing | create |
| package.json | Add `test` script | modify |
| SESSION_LOG.md | Session Journal entry for this STANDARD task | modify |
| .artifacts/prompt-eval-harness/pre_computation_block.md | Skill A artifact | create |
| .artifacts/prompt-eval-harness/simplicity_review.md | Skill B artifact | create |
| .artifacts/prompt-eval-harness/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/prompt-eval-harness/verification_matrix.md | Skill D artifact | create |
| .artifacts/prompt-eval-harness/adherence_report.md | Review-gate output | create |
| METRICS.md | Aggregated metrics rollup | modify |

## Out-of-Bound List
- hermes_watchdog.sh / manage_hermes.sh / start_after_reboot.sh — deployment.
- The Hermes output extraction + unwrapText (:218-242, :326-362) — issue dcdec9e.
- CLAUDE.md / README.md — no doc change required for this addition.

## Orthogonal Issues (noticed, skipped)
- Link + Q&A eval runners not built (assertions.js left general). Follow-up.
- LLM-as-judge quality layer documented but not coded. Follow-up.
- The recap nesting (recap prompt wrapped inside the French-style Q&A prompt at
  :706) is non-obvious; worth a code comment when 950dc54 modularises recap.

## Orphan Tracking
- After moving the inline strings out, no dangling vars: `prompt`/`recapPrompt`
  are reassigned to builder calls; the inline theme-loop's `themes` becomes the
  return of `extractThemes`. Verified by `node --check` + the test run.
