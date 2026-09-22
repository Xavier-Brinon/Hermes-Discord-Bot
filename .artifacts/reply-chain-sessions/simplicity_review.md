---
artifact_type: simplicity_review
task_id: reply-chain-sessions
timestamp: 2026-09-22T18:36:53Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
One Map, two key shapes. When the bot posts an answer, store the new Hermes session id under `msg:<answerId>` for every message it posted, and under the answer's place key when that place is a thread or DM. On an incoming mention, resume `msg:<repliedToId>` if present, else the thread/DM key, else nothing (a fresh channel @mention starts a new chain). Evict the oldest entry past 500.

## Abstinence List (not added, intentional)
- Reply-chain walking via REST — direct lookup of the replied-to id suffices.
- Per-user keys, per-channel locks, a TTL/LRU clock — see pre_computation_block.md alternatives.
- A migration of the legacy cache file — legacy thread keys still work, plain-channel keys age out.
- A config knob for the cap — constant, like MAX_PROCESSED_MESSAGES.
- Seeding sessions from 📝 summaries — issue 576af84.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     90 |    123 |  +37% |

Breakdown: cache.js ~+25 net, text.js ~+5, bot ~+2 net, tests ~+58 (6–7 cases at the repo's 5–8 lines per case, plus a fake-message helper).

## Simplify Triggers (detected)
- **Line-Count Budget FIRED: Target 90, Actual 123 net (+37%).** Split by kind: source is +12 net (cache.js +28, bot -10, text.js -6, modules.test.js -6) against a ~32 allowance — under budget, because `sendLongResponse` collapsed its two chunk loops into one and the bot lost its key/get/set boilerplate. Tests are +117 (text.test.js +39, cache.test.js +78) against 58: the Verification Matrix fixed 10 test rows before coding, but the budget sized ~7 at the old 5–8 lines each, and it omitted the shared fixtures (fakeChannel, the guildChannel/thread/dm/answer/incoming builders, the temp WORKSPACE_DIR setup — ~20 lines). Re-planned Target 125 (10 rows × ~8 + ~20 fixtures + ~25 source), Actual -2%.
- Cross-checked against the Abstinence List: none of its items appears in the diff, so the overage is test estimation error, not disguised scope. Cut considered and rejected: merging the thread and DM place tests — they exercise different `placeKey` branches.
