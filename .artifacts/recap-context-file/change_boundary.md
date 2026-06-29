---
artifact_type: change_boundary
task_id: recap-context-file
timestamp: 2026-06-28T11:13:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `prompts.js` | Add `buildAskPromptWithContextFile(question, ref)` builder + export | modify |
| `hermes-discord-bot-clean.js` | Add `MAX_ARGV_PROMPT_BYTES` const, temp-file write/cleanup helpers, and the byte-threshold offload guard in `askHermes` | modify |
| `test/prompts.test.js` | Unit test the new builder (shape: instruction + question + `@file:` ref) | modify |
| `.gitignore` | Ignore the transient `.hermes-recap-ctx-*.txt` temp pattern | modify |
| .artifacts/recap-context-file/pre_computation_block.md | Skill A artifact | create |
| .artifacts/recap-context-file/simplicity_review.md | Skill B artifact | create |
| .artifacts/recap-context-file/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/recap-context-file/verification_matrix.md | Skill D artifact | create |
| .artifacts/recap-context-file/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Append Pre-/Post-Flight journal section for this task | modify |
| METRICS.md | Regenerated rollup after adherence report lands | modify |

## Out-of-Bound List
- summarizeLink (hermes-discord-bot-clean.js) — small context; no overflow path; leaving it on argv keeps the diff scoped to the one place E2BIG is reachable
- prompts.js buildAskPrompt / buildRecapPrompt / extractThemes — prompt & parser contracts unchanged
- manage_hermes.sh — no run/ops change
- README.md / CLAUDE.md — `@file:` is a new coupling point but the parser-coupling caveat already exists in CLAUDE.md; no doc change required this task
- evals/run-recap-eval.js — recap prompt semantics unchanged for the inline path the evals exercise

## Orthogonal Issues (noticed, skipped)
- The 50%-of-context-length refusal in Hermes is a second (softer) size cliff for tiny-context models; the discord-bot profile uses a large-context model so it isn't reachable in prod — not worth a client-side guard now
- The temp file lands in the runtime workspace dir alongside `.link_cache.json`/`.session_cache.json`; a future cleanup-on-startup sweep could harden against crash-orphaned files — backlog, not this task

## Orphan Tracking
- None — the new builder/helpers/const are all referenced; no symbol becomes unused
