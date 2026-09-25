---
artifact_type: pre_computation_block
task_id: delete-thread-notice
timestamp: 2026-09-25T08:03:03Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Starting a thread on a message that is not the channel's latest makes Discord post a `ThreadCreated` (type 18) system message whose author is the user who started the thread — here the bot. | HIGH |
| 2   | That message reaches `messageCreate` under the existing `GuildMessages` intent. | HIGH |
| 3   | Manage Messages (already granted for ffed210) lets the bot delete it; if not, the delete fails, is logged, and the channel keeps the notice as today. | MEDIUM |

## Scope Declaration

### Files in scope
- `text.js` — **modify**. `isOwnThreadNotice` predicate.
- `hermes-discord-bot-clean.js` — **modify**. Early delete in `messageCreate`.
- `test/text.test.js` — **modify**. Predicate cases.
- `docs/adr/0001-link-summaries-always-in-a-thread.md` — **modify**. Consequence line.

### Files off-limits
- Intents list — GuildMessages already present.
- `prompts.js`, `cache.js`, `hermes-cli.js`, `config.js`.

## Interpretations of the request
1. **(Chosen)** Delete the bot's own ThreadCreated notices from the event stream — covers every thread the bot starts (📝, recap, long answers), all consistent with ADR 0001.
2. (Rejected) Fetch recent messages after `startThread` and look for the notice — races the notice, extra API call per thread.

## Gold Standard cited
`examples/patterns/surgical-diff.md`.
