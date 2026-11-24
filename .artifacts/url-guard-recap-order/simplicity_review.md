---
artifact_type: simplicity_review
task_id: url-guard-recap-order
timestamp: 2026-11-24T11:04:10Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
Extract a 5-line pure `isRecapRequest(content, { isReplyToBot, isDirectMessage })` helper in `recap.js` that returns `false` when `LINK_PATTERN.test(text)` matches, and move the existing `findBlockedUrl(content)` check above the recap branch in `hermes-discord-bot-clean.js`. Pin both the predicate and the entrypoint guard ordering in unit tests, and commit the escape postmortem.

## Abstinence List (not added, intentional)
- Full `messageCreate` Discord mock harness — heavyweight; extracting pure `isRecapRequest` plus a source-order regression test (matching `test/child-env.test.js`'s `execFile` audit) gives deterministic coverage in ~30 lines.
- Changing `HISTORY_PATTERN` regex — unnecessary once `isRecapRequest` excludes URL messages.
- Scanning historical channel messages inside recap for blocked URLs — recap uses a fixed theme-list prompt (`buildRecapPrompt`) and does not ask Hermes to fetch URLs; VPS egress hardening is tracked in `20261123T211937`.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     60 |     47 |   -13 |

## Simplify Triggers (detected)
- None. 12 net source logical LOC + 35 test logical LOC = 47 vs 60 target (-22%).
