---
artifact_type: verification_matrix
task_id: reaction-any-link
timestamp: 2026-07-04T10:50:15Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| extractLinks returns all links | Article + video + song links all returned, in order | `extractLinks('a https://lemonde.fr/1 b https://youtube.com/x c https://open.spotify.com/track/z')` → all three |
| extractLinks silent on no link | Plain text → `[]` | `extractLinks('bonjour tout le monde')` → `[]` |
| extractLinks no filter | A YouTube-only message yields the link (not dropped) | `extractLinks('https://youtube.com/watch?v=abc')` → `['https://youtube.com/watch?v=abc']` |
| extractLinks no throw on empty/null | No exception; `[]` | `extractLinks('')`, `extractLinks(null)`, `extractLinks(undefined)` → `[]` |
| denylist removed | `NON_ARTICLE_PATTERN` + `isNonArticleUrl` gone from text.js + exports | grep finds no definition/export; no production reference |
| no dangling references | entrypoint + modules.test import `extractLinks`, not the removed names | `node --check` all files; eslint no-undef clean |
| handler summarises any link | reaction path calls `extractLinks`, summarises on ≥1, silent on 0 | code review of the handler; `summariseLinks` invoked |
| Suite + lint green | `npm test` all pass; eslint 0 errors; prettier clean on changed JS | `npm test`, `npx eslint .`, `npx prettier --check` |
| Issue lifecycle documented | Comment posted before `rad issue state --solved` (patch ID + merge SHA + verification) | `rad issue show 71e2200` shows the transition comment |
