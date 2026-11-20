---
artifact_type: verification_matrix
task_id: music-streaming-skip
timestamp: 2026-07-02T08:53:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Incident URL is now skipped | The exact Spotify track URL from the report classifies as non-article | `node -e "isNonArticleUrl('https://open.spotify.com/track/0Rwt...?si=...')"` → true | PASS — true |
| All enumerated hosts skipped | spotify.link, music.apple.com, soundcloud.com, deezer.com, *.bandcamp.com, tidal.com, music.amazon.*, audiomack.com all classify as non-article | `node -e` over the 8 representative URLs → every one true | PASS — ALL true |
| Real articles unaffected | A plain news article is still an article (no over-broad match) | `node -e "isNonArticleUrl('https://lemonde.fr/article/123')"` → false | PASS — false |
| Reddit un-skipped | Reddit posts now classify as articles (summarisable), per user request | `node -e` over www.reddit.com + old.reddit.com post URLs → false | PASS — both false |
| Test coverage locked in | New unit tests (music-streaming skip + reddit un-skip) pass with the suite | `npm test` | PASS — 52 pass / 0 fail (was 50) |
| Lint clean | `npm run lint` exits 0 | `npm run lint` | PASS — 0 errors (4 pre-existing warnings in hermes-discord-bot-clean.js untouched) |
| Format clean | Changed files conform to Prettier | `npx prettier --check text.js test/text.test.js` | PASS — "All matched files use Prettier code style" |
| Issue lifecycle documented | Comment posted before `rad issue state --solved` recording patch ID + merge SHA + verification | `rad issue show e89a541` shows lifecycle comment | PENDING — lands at merge |
