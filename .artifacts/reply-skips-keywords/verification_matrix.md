---
artifact_type: verification_matrix
task_id: reply-skips-keywords
timestamp: 2026-09-22T20:21:43Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Root cause | the live reply matches HISTORY_PATTERN | `node -e` with the exact reply text | PASS — matches `historique` at index 56 |
| Reply skips help + recap | both keyword branches guarded by `!isReplyToBot` | code inspection of the diff | PASS |
| Fresh @mention unchanged | guards only add `!isReplyToBot`; non-reply path evaluates the same conditions | code inspection | PASS |
| Suite + lint + format | `npm test`, `npx eslint .`, `npx prettier --check .` | commands | PASS — 124/124, eslint 0, prettier clean |
| Live: reply containing "historique" gets an answer | no recap thread; normal reply | manual after deploy | PENDING — deploy-time |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show 86a3d87` | PENDING — lands at merge |
