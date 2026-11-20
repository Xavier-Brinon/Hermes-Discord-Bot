---
artifact_type: verification_matrix
task_id: summary-questions
timestamp: 2026-09-22T19:00:50Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Parser happy path | header + 3 numbered lines → body without block + 3 questions | test/prompts.test.js | PASS — `splitQuestions — cuts the numbered questions off…` |
| Parser: header merged mid-line by unwrapText | still splits, body keeps the text before the header | test/prompts.test.js | PASS — unit test + scratchpad run of real `unwrapText` on hard-wrapped output with no blank lines: splits 3 questions, body intact |
| Parser never drops content | trailing non-question line, < 2 questions, no header, abstention text → null | test/prompts.test.js | PASS — 7 null cases in one test (trailing line, 1 question, unnumbered, empty body, no header, empty, null) |
| Format wording | numbered points `1. **Titre** :`, numbered questions, no #, adaptive markers kept | test/prompts.test.js | PASS — digit-first points, `**Questions** :` + 3 numbered lines, no #; the adaptive-marker test still passes |
| Question helpers | questionFrom recognises only `❓ ` messages; buildQuestionReply quotes the question | test/prompts.test.js | PASS — `questionFrom` + `buildQuestionReply` tests |
| summarizeLink returns session | resolves `{ summary, sessionId }`; abstentions carry sessionId null | code inspection | PASS — all 3 resolve sites return `{ summary, sessionId }`; the two abstentions pass `sessionId: null`; single caller updated |
| Suite + lint + format | `npm test`, `npx eslint .`, `npx prettier --check .` | commands | PASS — `npm test` 124/124 (was 117, +7); eslint 0; prettier clean |
| Live: layout | 📝 → summary, then 3 ❓ messages replying to it; Points clés one per line | manual after deploy | PENDING — deploy-time |
| Live: reply to a question | answer addresses that question with article detail; two members on two questions stay separate | manual after deploy | PENDING — deploy-time |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show 576af84` | PENDING — lands at merge |
