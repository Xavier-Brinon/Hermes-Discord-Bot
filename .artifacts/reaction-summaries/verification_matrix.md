---
artifact_type: verification_matrix
task_id: reaction-summaries
timestamp: 2026-07-04T07:33:11Z
complexity_score: 4
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| extractArticleLinks returns article links | A message with an article URL yields `[url]` | `extractArticleLinks('voir https://lemonde.fr/a')` → `['https://lemonde.fr/a']` |
| extractArticleLinks drops non-articles | Only-non-article content yields `[]` | `extractArticleLinks('https://youtube.com/x')` → `[]` |
| extractArticleLinks silent on no link | Plain text yields `[]` | `extractArticleLinks('bonjour tout le monde')` → `[]` |
| extractArticleLinks keeps order, mixed | Article kept, video dropped, order preserved | `extractArticleLinks('a https://lemonde.fr/1 b https://youtube.com/x c https://lemonde.fr/2')` → the two lemonde urls |
| extractArticleLinks no throw on empty/null | No exception; `[]` | `extractArticleLinks('')`, `extractArticleLinks(null)` → `[]` |
| SUMMARY_REACTION exported | config exports `'📝'` | `require('./config').SUMMARY_REACTION === '📝'` |
| Partials fixed to enum | client built with `Partials.Channel/Message/Reaction`; module loads | `node -e "require('./hermes-discord-bot-clean')"` needs env; assert import present via grep |
| Auto-summary removed | No auto-detect block remains | grep shows the `Auto-detect: link without @mention` block is gone |
| entrypoint orphan removed | `isNonArticleUrl` no longer imported in entrypoint | eslint `no-unused-vars` clean on the import |
| Suite + lint green | `npm test` all pass; eslint 0 errors; prettier clean on changed JS | `npm test`, `npx eslint .`, `npx prettier --check` |
| Issue lifecycle documented | Comment posted before `rad issue state --solved` (patch ID + merge SHA + verification) | `rad issue show c8dafc0` shows the transition comment |
