---
artifact_type: pre_computation_block
task_id: music-streaming-skip
timestamp: 2026-07-02T08:53:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The auto link-summary gate is `isNonArticleUrl` → `NON_ARTICLE_PATTERN` (text.js); a URL that fails the test is sent to `summarizeLink`. Adding a host to the pattern is sufficient to make the bot skip it silently — no change at the call site. | HIGH |
| 2 | `NON_ARTICLE_PATTERN.test(url)` is a substring (unanchored) match, so `open.spotify.com` matches an alternative `spotify\.(com\|link)`, and `artist.bandcamp.com` matches `bandcamp\.com`. | HIGH |
| 3 | The incident URL (`open.spotify.com/track/...?si=...`) and the enumerated hosts are music-first domains with no article body worth summarising — skipping them is always correct, no false-positive risk against legitimate articles. | HIGH |
| 4 | This fixes the *known* song-link hole only. Unknown non-article pages still slip through; that broader gap is the separate issue 6b1af90 (content-aware abstain gate) and is deliberately out of scope. | HIGH |

## Scope Declaration
### Files in scope
- text.js — extend `NON_ARTICLE_PATTERN` with music-streaming/player hosts (Spotify, Apple Music, SoundCloud, Deezer, Bandcamp, Tidal, Amazon Music, Audiomack) + update the doc comment
- test/text.test.js — add a test pinning the incident Spotify URL and representative hosts to `isNonArticleUrl === true`

### Files off-limits
- hermes-cli.js (`summarizeLink`) / prompts.js (`buildLinkPrompt`) — teaching Hermes to abstain on contentless pages is issue 6b1af90, a separate concern
- hermes-discord-bot-clean.js — the filter call site (`articleLinks = links.filter(l => !isNonArticleUrl(l))`) is unchanged; behaviour flows from the pattern
- config.js — `LINK_PATTERN` (detection) is unrelated to classification

## Interpretations of the request
- "no bot should do nothing" = the bot must stay silent on a song link, exactly as it already does for YouTube/images — i.e. the link joins the existing silent skip-list, not a new code path
- "recap for a completely different song" = a hallucination: Hermes was handed a contentless JS page and, ordered to summarise, invented a famous track. Prevented here by never sending song links to Hermes at all.
- "make sure to not blacklist reddit" (mid-task) = `reddit\.com` was ALREADY in the denylist (pre-existing), so reddit posts were being silently skipped. User wants the opposite — remove it so reddit posts reach the summariser. Reddit post pages carry real server-rendered text, so summarising them is viable (unlike Spotify). Folded into this same regex change.

## Alternatives considered
- Content-aware gate (fetch + paragraph-density heuristic, or Hermes abstain token) — rejected for this issue: larger change, own risk profile; filed as 6b1af90
- Switch the denylist to an allowlist of known article hosts — rejected: brittle, would suppress legitimate articles from unknown domains

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `node -e "console.log(require('./text').isNonArticleUrl('https://open.spotify.com/track/0RwtlGnvXFIZ9OuKlAm2F5?si=x'))"` | true | true | 2026-07-02T08:53:00Z | PASS |
| 2 | `node -e "console.log(require('./text').isNonArticleUrl('https://lemonde.fr/article/123'))"` | false (real article unaffected) | false | 2026-07-02T08:53:00Z | PASS |
