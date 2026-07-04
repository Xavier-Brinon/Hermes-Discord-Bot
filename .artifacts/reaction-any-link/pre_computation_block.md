---
artifact_type: pre_computation_block
task_id: reaction-any-link
timestamp: 2026-07-04T10:50:15Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The 📝 reaction is the human's "worth summarising" decision, so the reaction path must not re-filter by host | HIGH |
| 2 | After c8dafc0, `isNonArticleUrl` / `NON_ARTICLE_PATTERN` have exactly one production consumer — `extractArticleLinks`; removing that consumer makes them dead | HIGH |
| 3 | Nothing else (the @mention path, recap, hermes-cli) references the denylist — verified by grep | HIGH |
| 4 | `modules.test.js` smoke-checks `isNonArticleUrl` in a text.js export list; it must be swapped for `extractLinks` or the smoke test breaks | HIGH |
| 5 | `ALL_LINKS_PATTERN` (the global URL regex added in c8dafc0) stays — `extractLinks` reuses it | HIGH |

## Scope Declaration
### Files in scope
- text.js — remove `NON_ARTICLE_PATTERN` + `isNonArticleUrl` + `extractArticleLinks`; add pure `extractLinks(content)` (all URLs, [] when none); fix header comment + exports
- hermes-discord-bot-clean.js — reaction handler uses `extractLinks`; rename `summariseArticleLinks` → `summariseLinks`; drop non-article wording from the handler comment
- test/text.test.js — remove the `isNonArticleUrl` + `extractArticleLinks` suites; add an `extractLinks` suite
- test/modules.test.js — swap `isNonArticleUrl` → `extractLinks` in the text export-check list
- config.js — update the one comment that name-drops `NON_ARTICLE_PATTERN / isNonArticleUrl`

### Files off-limits
- hermes-cli.js / prompts.js / recap.js / cache.js — no denylist references
- the @mention/DM Q&A + recap handlers — unchanged (already unfiltered)

## Interpretations of the request
- "no need of extra check" = the reaction path drops isNonArticleUrl; summarise on ≥1 link, silent on 0 links
- "yes delete" = remove the denylist helpers entirely (not keep-dormant)

## Alternatives considered
- Keep `isNonArticleUrl`/`NON_ARTICLE_PATTERN` as dormant tested utilities — rejected: user said delete; dead code is a smell and it's recoverable from git history / the e89a541 patch
- Add `extractLinks` alongside `extractArticleLinks` — rejected: leaves a this-session function with zero callers (dead code)
- Keep the name `extractArticleLinks` but drop the filter — rejected: the name would lie (it no longer selects "article" links)

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -rn "isNonArticleUrl" *.js` (production, non-test) | only text.js self + the extractArticleLinks caller | text.js:30/41 + export; no other prod caller | 2026-07-04T10:45:00Z | PASS |
| 2 | `grep -rn "NON_ARTICLE_PATTERN" *.js` (production, non-test) | only text.js self + a config comment | text.js:26/31 + export + config.js:32 comment | 2026-07-04T10:45:00Z | PASS |
| 3 | `grep -rn "extractArticleLinks" *.js` (production, non-test) | only the reaction handler + text.js | entrypoint:23/500 + text.js def/export | 2026-07-04T10:45:00Z | PASS |
