---
artifact_type: simplicity_review
task_id: reaction-any-link
timestamp: 2026-07-04T10:50:15Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Replace `extractArticleLinks` (all links minus non-articles) with a pure `extractLinks(content)` that returns every URL, `[]` when there is none — no host filter. Delete the now-orphaned `NON_ARTICLE_PATTERN` + `isNonArticleUrl`. Point the reaction handler at `extractLinks` (silent only on 0 links) and rename `summariseArticleLinks` → `summariseLinks`. Net effect is a smaller file: one 2-line pure function replaces a regex + a predicate + a filtering extractor.

## Abstinence List (not added, intentional)
- A config knob to toggle host filtering — the whole point is that the human's reaction is the filter; a knob re-adds the complexity being deleted
- A "kind" classifier (article/video/song) returned alongside the links — nothing consumes it; the summary path treats all links the same
- Keeping `isNonArticleUrl` "just in case 6b1af90 needs it" — YAGNI; 6b1af90 judges content, not host, and git history preserves it
- A dedicated URL-parsing module — `extractLinks` is one line over the existing `ALL_LINKS_PATTERN`

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      8 |     10 |    +2 |

Actual = added logical LOC across text.js + entrypoint + config.js. NET is **−9** (added 10,
removed 19): the `summariseArticleLinks → summariseLinks` rename inflates "added" with lines
that are also removed, while the denylist deletion is pure removal. +2 over an 8 target is
exactly +25% (not over the >25% trigger), and the change removes code overall — no trigger.

## Simplify Triggers (detected)
- None
