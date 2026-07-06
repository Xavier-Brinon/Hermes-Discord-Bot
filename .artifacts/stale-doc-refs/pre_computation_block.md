---
artifact_type: pre_computation_block
task_id: stale-doc-refs
timestamp: 2026-07-06T19:54:23Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `NON_ARTICLE_PATTERN` / `isNonArticleUrl` are deleted — only a tombstone comment remains in text.js | HIGH |
| 2 | Link summaries are 📝-reaction opt-in (`messageReactionAdd` + `SUMMARY_REACTION`); auto-summary-on-post was removed | HIGH |
| 3 | The bot parses Hermes' `-Q` programmatic output via `parseHermesOutput`; there is no `⚕ Hermes` banner to scrape | HIGH |
| 4 | The summary applies to ANY link, not just "article" URLs (the denylist that made it article-only is gone) | HIGH |
| 5 | README.md and hermes-discord-bot.md carry none of these stale terms (only CONTEXT.md + CLAUDE.md do) | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `git grep -n NON_ARTICLE_PATTERN -- '*.js'` | only a tombstone comment | text.js:20-21 "The former isNonArticleUrl/NON_ARTICLE_PATTERN denylist … dropped" | 2026-07-06T19:50:00Z | PASS |
| 2 | `git grep -nE "'-Q'" hermes-cli.js` | `-Q` pushed to Hermes | hermes-cli.js:95 and :156 push `-Q` | 2026-07-06T19:50:00Z | PASS |
| 3 | `git grep -n "no .*Hermes. banner" prompts.js` | code states no banner | prompts.js:122 "no `⚕ Hermes` banner, no `Query:` echo" | 2026-07-06T19:50:00Z | PASS |
| 4 | `git grep -nE "messageReactionAdd|SUMMARY_REACTION" hermes-discord-bot-clean.js` | reaction-triggered summary | handler at :486, guard at :492; :400 "Auto-summary was removed" | 2026-07-06T19:50:00Z | PASS |
| 5 | `grep -niE "NON_ARTICLE_PATTERN|auto link-summary|article URL" README.md hermes-discord-bot.md` | no hits | no matches | 2026-07-06T19:50:00Z | PASS |

## Scope Declaration
### Files in scope
- CONTEXT.md — "Link summary" entry (article/auto/denylist all stale) and "Banner parsing" entry (renamed to `-Q` output parsing)
- CLAUDE.md — the top summary line, the CLI-wrapper architecture bullet (banner→`-Q`), and the three-flows line (auto-article→📝-reaction)

### Files off-limits
- README.md — already accurate after the watchdog cleanup; carries none of these terms
- hermes-discord-bot.md — no stale terms (verified)
- all .js — this is a docs-accuracy fix; the CODE is the source of truth and is already correct; touching it would be scope bleed

## Interpretations of the request
- "Fix the stale docs" = correct documentation claims that no longer match the code after issues c8dafc0 (reaction opt-in), 71e2200 (denylist deleted, any-link), and 9864045 (`-Q` parsing). Not a code change.

## Alternatives considered
- Fix only the one CONTEXT.md `NON_ARTICLE_PATTERN` line I first noticed — rejected: a grep-sweep found the same rot in the "Banner parsing" entry and two CLAUDE.md spots; fixing one and leaving three is worse.
- Also reformat the pre-existing prettier dirt in CONTEXT.md — rejected: orthogonal whole-file churn (config.js precedent); match the existing style instead.
