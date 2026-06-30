---
artifact_type: pre_computation_block
task_id: test-pure-helpers
timestamp: 2026-06-30T06:14:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `unwrapText` and `splitAtBoundaries` are already pure — they read only their arguments (+ `splitAtBoundaries` takes `maxLen`), no module state, no I/O — so moving them verbatim into `text.js` cannot change behaviour | HIGH |
| 2 | The inline timeframe logic (bot :618-668) is pure given `content` + `now`; the `fetchChannelHistory` calls and the `<10 msgs → extend to 30 days` logic are impure and stay in the handler. `parseTimeframe(content, now)` returns `{ daysBack, sinceTs, untilTs }` | HIGH |
| 3 | `NON_ARTICLE_PATTERN` is a pure regex; wrapping it in `isNonArticleUrl(url)` in `text.js` makes it testable without behaviour change | HIGH |
| 4 | `node:test` is built-in (already the test runner — `package.json` `test` script + `test/prompts.test.js`), so tests add no dependency | HIGH |
| 5 | npm registry is reachable, so eslint+prettier devDeps install; eslint v9 flat config + node globals runs on the repo (legacy file may emit warnings — acceptable, "lint available" is the bar, not "zero findings") | MEDIUM |
| 6 | The bot's `formatHermesResponse` and `sendLongResponse` keep working once `unwrapText`/`splitAtBoundaries` are imported (same function objects, same call sites) | HIGH |

## Scope Declaration
### Files in scope
- text.js — new module: `unwrapText`, `splitAtBoundaries`, `isNonArticleUrl` (+ the patterns they use)
- recap.js — new module: pure `parseTimeframe(content, now)`
- test/text.test.js — unit tests for the text helpers (edge cases: long paragraphs, structural markers, hard-split, non-article URLs)
- test/recap.test.js — unit tests for parseTimeframe (months, relative, numeric, default) against a fixed `now`
- eslint.config.js, .prettierrc — linter/formatter config
- package.json — devDeps + `lint`/`format` scripts
- hermes-discord-bot-clean.js — import from the new modules; delete the inline defs; replace the inline timeframe block with `parseTimeframe`

### Files off-limits
- prompts.js — separate concern; already its own tested module
- askHermes / summarizeLink — recap-context-file owns those; unchanged here
- config / hermes / cache module extraction — that is issue 950dc54 (the next task)
- manage_hermes.sh, README.md, CLAUDE.md, evals/ — no run/ops/doc/eval change

## Interpretations of the request
- "Add tests for the pure helpers" = unit tests with edge cases for unwrapText, splitAtBoundaries, the timeframe parser, and NON_ARTICLE_PATTERN — which first requires lifting them where they can be imported without the bot's Discord-login side effects.
- "relates to the modularisation issue" + user decision = extract into the real `text.js`/`recap.js` modules now (front-loading 2 of 950dc54's 5 modules), not interim scaffolding.
- "npm run lint available" = a runnable eslint+prettier setup; not a clean-bill-of-health on the 893-line legacy file.

## Alternatives considered
- Guard the bot behind `require.main === module` + export helpers, test in place — rejected: user chose real module extraction; the guard would be throwaway scaffolding 950dc54 reworks.
- Put the helpers in prompts.js — rejected: prompts.js is "prompts the bot sends to Hermes"; output-formatting + timeframe parsing are different concerns and map to 950dc54's text/recap modules.
- Add jest/vitest — rejected: node:test is built-in, zero-dependency, already the convention.
- Rewrite/simplify the helpers while moving — rejected: surgical-diff discipline; a byte-faithful move keeps behaviour provable.
- Full eslint cleanup of the legacy bot — rejected: out of scope; would balloon the diff. Pre-existing findings noted as orthogonal.

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | read bot :333-369 / :381-429 — do unwrapText/splitAtBoundaries touch module state? | only their args | only args (+ maxLen); pure | 2026-06-30T06:05:00Z | PASS |
| 2 | read bot :617-681 — separate pure (date math) from impure (fetch) | date math pure; fetch impure | parseTimeframe = {daysBack,sinceTs,untilTs}; fetch stays in handler | 2026-06-30T06:06:00Z | PASS |
| 3 | `ls node_modules/.bin/eslint`; `npm ping` | not installed; registry reachable | absent; PONG (registry up) | 2026-06-30T06:13:00Z | PASS |
| 4 | confirm node:test already used | test/prompts.test.js + `test` script exist | both present (19 tests pass) | 2026-06-30T06:06:00Z | PASS |
