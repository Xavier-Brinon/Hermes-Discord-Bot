---
artifact_type: pre_computation_block
task_id: url-guard-recap-order
timestamp: 2026-11-24T11:04:10Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `HISTORY_PATTERN` in `config.js` matches `résume` and `summarize`, so `@mention résume <url>` entered the recap branch in `hermes-discord-bot-clean.js` before reaching `findBlockedUrl(content)`. | HIGH |
| 2 | `hermes-discord-bot-clean.js` is the only consumer of `HISTORY_PATTERN`; moving the check into `recap.isRecapRequest` leaves zero other uses of `HISTORY_PATTERN` in the entrypoint. | HIGH |
| 3 | A message with a URL (`LINK_PATTERN.test(content)`) is always a link summary or Q&A, never a channel history recap. | HIGH |
| 4 | Running `findBlockedUrl(content)` immediately after the static `aide`/`help` branch blocks private/local/disallowed URLs before both recap and Q&A paths. | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | Live Discord test `@Le Mistral Bot résume http://127.0.0.1/` + reading `hermes-discord-bot-clean.js:303-415` | Recap branch ran at line 303 before `findBlockedUrl` at line 410 | Confirmed: bot replied with channel recap themes instead of `messagesFR.linkBlocked` | 2026-11-24T11:01:18Z | PASS |
| 2 | `git grep -n HISTORY_PATTERN` | Only `config.js`, `hermes-discord-bot-clean.js`, and `test/modules.test.js` | Confirmed from earlier read of `config.js`, `hermes-discord-bot-clean.js`, `test/modules.test.js` | 2026-11-24T11:04:00Z | PASS |
| 3 | Read `hermes-discord-bot-clean.js:450` | `wantsSummary = LINK_PATTERN.test(content)` already treats URL mentions as link summaries | Confirmed at line 450 | 2026-11-24T11:04:00Z | PASS |
| 4 | Read `hermes-discord-bot-clean.js:290-415` | `aide`/`help` is static text only; recap and Q&A are the two `askHermes` paths | Confirmed: lines 303-405 (recap) and 410-480 (Q&A) | 2026-11-24T11:04:00Z | PASS |

## Scope Declaration
### Files in scope
- `recap.js` — add pure `isRecapRequest(content, { isReplyToBot, isDirectMessage })` excluding URL messages.
- `hermes-discord-bot-clean.js` — move `findBlockedUrl(content)` above the recap branch and call `isRecapRequest`; remove unused `HISTORY_PATTERN` import.
- `test/recap.test.js` — unit tests for `isRecapRequest` (URL vs non-URL, reply, DM).
- `test/url-guard.test.js` — regression test asserting `findBlockedUrl` precedes `isRecapRequest` and every `askHermes` call in `hermes-discord-bot-clean.js`.
- `test/modules.test.js` — assert `recap.isRecapRequest` is exported.
- `docs/postmortems/20261124T110355--run-url-guard-before-recap-routing.org` — escape postmortem per `emacs-ops`.
- `SESSION_LOG.md`, `METRICS.md`, `.artifacts/url-guard-recap-order/*` — framework records.

### Files off-limits
- `url-guard.js` — IP/URL/DNS classification itself worked as designed.
- `config.js` — `HISTORY_PATTERN` and `LINK_PATTERN` stay unchanged.
- `hermes-cli.js` — CLI wrapper unchanged.

## Interpretations of the request
- Primary: fix both halves of the live escape (move URL guard ahead of recap routing, and prevent `HISTORY_PATTERN` from hijacking URL mentions like `résume https://...`), pin with tests, and commit the escape postmortem.

## Alternatives considered
- Moving `findBlockedUrl` into `askHermes` (`hermes-cli.js`) — rejected: `askHermes` runs on arbitrary channel-recap transcripts (which may contain unrelated old URLs) and does not own Discord reply/reaction handling; gating user input before routing in `messageCreate` is cleaner and fixes the UX routing bug too.
- Removing `résume` from `HISTORY_PATTERN` — rejected: breaks `@bot résume la semaine`, which is a primary recap trigger; excluding messages with `LINK_PATTERN` preserves both flows.
