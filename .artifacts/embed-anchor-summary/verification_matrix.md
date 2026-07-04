---
artifact_type: verification_matrix
task_id: embed-anchor-summary
timestamp: 2026-07-04T14:06:25Z
complexity_score: 4
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| extractLinkMeta reads a YouTube embed | Returns {title, author, provider} from the matching embed | duck-typed message with one embed {title, author.name, provider.name, url} → those fields |
| extractLinkMeta matches by url | With multiple embeds, returns the one whose `.url` equals the link | two embeds, pick the url-matching one |
| extractLinkMeta null when no embed | No embeds / no title → null | `{embeds: []}`, `{embeds: [{}]}` → null |
| extractLinkMeta no throw on missing shape | No exception | `extractLinkMeta(null, url)`, `{}` → null |
| buildLinkPrompt meta=null unchanged | Byte-identical to the pre-change prompt | assert equals the literal current output |
| buildLinkPrompt with meta | Prompt contains the title, author, and the sentinel instruction | assert includes title, author, `CONTENU_INACCESSIBLE` |
| sentinel → honest message | summarizeLink maps a sentinel reply to `messagesFR.linkUnreadable` | code review (integration; shells out — not unit-run) |
| honest failure posted, not silent | On sentinel the bot posts `linkUnreadable` (decision #2) | code review of summariseLinks/summarizeLink return path |
| Suite + lint green | `npm test` all pass; eslint 0 errors; prettier clean on changed JS | `npm test`, `npx eslint .`, `npx prettier --check` |
| abstention reliability (deploy) | 📝 on the fairy YouTube link → honest abstention, not a wrong summary | live check on the VPS after deploy (prompt-dependent) |
| Issue lifecycle documented | Comment before `rad issue state --solved` (patch ID + SHA + verification) | `rad issue show 1b94451` shows the transition comment |
