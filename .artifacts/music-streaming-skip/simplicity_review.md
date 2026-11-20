---
artifact_type: simplicity_review
task_id: music-streaming-skip
timestamp: 2026-07-02T08:53:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Simplest Possible Solution
Add the music-streaming/player hosts as new alternatives inside the existing
`NON_ARTICLE_PATTERN` regex in text.js, and remove the `reddit\.com` alternative
(reddit posts are worth summarising), refreshing the doc comment to say why. The
classifier, its call site, and the summary path are all untouched — a song link
now takes the same silent-skip branch that YouTube and images already take, while
a reddit link now takes the summarise branch. One test block locks in the incident
URL plus one representative URL per host; another asserts reddit posts are articles.

## Abstinence List (not added, intentional)
- A separate `MUSIC_PATTERN` / second predicate — YAGNI; one denylist already exists and is the right home
- A per-host allowlist or config knob for "which media to summarise" — no requirement; over-engineering
- Content sniffing / fetch-then-decide — that is the separate issue 6b1af90, not this fix
- Touching `summarizeLink` / `buildLinkPrompt` — the song link never reaches them once skipped

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      6 |      6 |     0 |

(1 regex line replacing 1, +5 comment lines; the test block is additive and excluded from the logic budget.)

## Simplify Triggers (detected)
- None
