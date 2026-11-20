---
artifact_type: change_boundary
task_id: summary-format
timestamp: 2026-07-03T10:21:01Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `prompts.js` | Add buildSummaryFormat(); add `summarize` param to buildAskPrompt; rewire buildLinkPrompt; export the new fn | modify |
| `hermes-cli.js` | askHermes gains a `summarize` option, forwarded to buildAskPrompt | modify |
| `hermes-discord-bot-clean.js` | @mention path: wantsSummary = URL in message → enable web tools + pass summarize | modify |
| `test/prompts.test.js` | Update buildLinkPrompt byte-identity; add summarize + buildSummaryFormat cases; import new export | modify |
| `evals/assertions.js` | hasLinkStructure keys off Thèse/Idée + Questions | modify |
| `CONTEXT.md` | Update the "Link summary" glossary entry | modify |
| `hermes-discord-bot.md` | Update the "Summarises" bullet | modify |
| .artifacts/summary-format/pre_computation_block.md | Skill A artifact | create |
| .artifacts/summary-format/simplicity_review.md | Skill B artifact | create |
| .artifacts/summary-format/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/summary-format/verification_matrix.md | Skill D artifact | create |
| .artifacts/summary-format/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- buildAskPromptWithContextFile (prompts.js) — recap/large-context path; a recap is not a link summary and link summaries don't hit the offload threshold
- summarizeLink (hermes-cli.js) — already calls buildLinkPrompt, inherits the format for free
- config.js / text.js / cache.js / recap.js — no summary-format surface

## Orthogonal Issues (noticed, skipped)
- Prettier normalised PRE-EXISTING JS format drift in hermes-cli.js (execFile blocks), hermes-discord-bot-clean.js, and evals/assertions.js while formatting the touched files. Kept — same precedent as global-error-handlers; makes `prettier --check` pass on every changed JS file. Inflates the diff but changes no logic.
- CONTEXT.md / hermes-discord-bot.md fail `prettier --check` — but that drift is PRE-EXISTING (HEAD versions fail too) and Markdown is NOT in the enforced gate (`npm run lint` = eslint/JS only). Left as-is; edited lines match the surrounding table/bullet style. Whole-doc reformatting would be doc scope bleed.
- @mention summary-intent = URL-presence, so a pointed question that also carries a URL gets the format (mild false positive). Documented in issue ec634229; refine with a stricter check later if needed.

## Orphan Tracking
- None — buildSummaryFormat is exported, imported by the test, and called by buildAskPrompt/buildLinkPrompt; hasLinkStructure keeps its signature/consumers.
