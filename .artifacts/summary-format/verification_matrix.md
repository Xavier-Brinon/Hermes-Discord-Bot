---
artifact_type: verification_matrix
task_id: summary-format
timestamp: 2026-07-03T10:21:01Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Plain Q&A unchanged | buildAskPrompt(q,ctx) with summarize=false is byte-identical to the former literal (no format leak) | `test/prompts.test.js` byte-identity cases + `node -e` equality check | PASS — true |
| Summarize appends format | buildAskPrompt(q,ctx,true) ends with the shared summary format | `test/prompts.test.js`: out.endsWith(`\n\n${buildSummaryFormat()}`) | PASS — test green |
| Link prompt uses shared format | buildLinkPrompt embeds buildSummaryFormat() verbatim | `test/prompts.test.js`: includes(buildSummaryFormat()) + byte-identity | PASS — test green |
| Adaptive markers present | buildSummaryFormat carries Thèse centrale/Idée principale, Arguments/Points clés, Questions | `test/prompts.test.js`: 3 regex asserts | PASS — test green |
| Eval assertion re-keyed | hasLinkStructure true on a Thèse+Questions summary, false on plain prose | `node -e` over evals/assertions.js | PASS — true / false |
| Entrypoint wiring | @mention path sets wantsSummary from a URL, enables web tools, passes summarize | `grep -n "wantsSummary\|summarize: wantsSummary"` → lines 315/316/326 | PASS — present |
| Suite + lint + format | npm test green; eslint 0 errors; prettier clean on changed JS | `npm test` / `npm run lint` / `npx prettier --check <changed .js>` | PASS — 56/56, 0 errors, JS clean |
| Issue lifecycle documented | Comment posted before `rad issue state --solved` recording patch ID + merge SHA + verification | `rad issue show ec634229` shows lifecycle comment | PENDING — lands at merge |
