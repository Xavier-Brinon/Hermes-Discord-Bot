---
artifact_type: simplicity_review
task_id: test-pure-helpers
timestamp: 2026-06-30T06:15:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
Move the three already-pure helpers verbatim into topical modules — `text.js`
(`unwrapText`, `splitAtBoundaries`, plus a one-line `isNonArticleUrl` wrapping the
existing `NON_ARTICLE_PATTERN`) and `recap.js` (`parseTimeframe(content, now)` lifted
from the inline recap block, returning `{daysBack, sinceTs, untilTs}`) — then have the
bot `require` them and delete the inline copies. Test each with built-in `node:test`.
Add a minimal eslint(flat config) + prettier setup with `npm run lint`/`format`. No
logic rewrite: the bodies relocate byte-for-byte so behaviour is provably unchanged.

## Abstinence List (not added, intentional)
- No jest/vitest/mocha — node:test is built-in and already the convention
- No rewrite/“improvement” of the helper logic while moving — surgical move only
- No config/hermes/cache module extraction — that is issue 950dc54
- No full legacy-lint cleanup of the 893-line bot — out of scope; eslint set to surface, not gate
- No new runtime dependency — text.js/recap.js are plain modules; eslint/prettier are devDeps only
- No `parseTimeframe` taking the channel/fetch — kept pure (content + now in, plain object out); fetch stays in the handler

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|    145 |    128 |  -12% |

Methodology: added logical LOC (non-blank, non-comment) across the **production**
files only — `text.js` + `recap.js` + `hermes-discord-bot-clean.js` — via
`git diff | awk`. Tests, eslint/prettier config, and package.json are excluded
(consistent with prior tasks excluding test + config). NOTE: ~90% of the count is
**verbatim relocation** of existing function bodies (counted as additions in the new
modules); genuinely new logic is ~15 LOC (module exports, `isNonArticleUrl`, the
`parseTimeframe` signature + return object, the bot's import lines). Target is sized
for the relocation; a large number here is a move, not new complexity.

## Simplify Triggers (detected)
- None. Actual 128 logical LOC is under the 145 target (-12%); the bot itself shed
  157 lines. As predicted, the count is dominated by verbatim relocation into
  text.js/recap.js — no new abstraction was introduced.
