---
artifact_type: verification_matrix
task_id: strip-reading-progress
timestamp: 2026-07-03T14:04:43Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Leading trace lines stripped | A captured stdout with leading `📄/📖 Reading` lines parses to the answer only | `test/prompts.test.js`: fixture from the issue capture → response === the "Voici un résumé…" answer | PASS — test green |
| Interleaved trace line stripped | A `📖 Reading` line appearing after the answer starts is also removed (line-wise, not leading-only) | `test/prompts.test.js`: answer / trace / answer → response has both answer lines, no trace | PASS — test green |
| Real answer untouched | An answer that legitimately contains "reading" or leads with an emoji is unchanged | `test/prompts.test.js`: French answer mentioning "reading" + emoji → byte-identical | PASS — test green |
| Existing contracts intact | The ⚠, clarify, and session-id cases still pass | `npm test` (whole prompts suite) | PASS — combined-leak spot check clean answer + id kept |
| Suite green | `npm test` passes with the new cases | `node --test test/*.test.js` | PASS — 59/59; eslint 0 errors; prettier clean on prompts.js + test |
| Issue lifecycle documented | Comment posted before `rad issue state --solved` recording patch ID + merge SHA + verification + the "redeploy alone won't fix" note | `rad issue show c0003a51` shows the lifecycle comment | PENDING — lands at merge |
