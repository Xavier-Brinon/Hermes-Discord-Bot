---
artifact_type: simplicity_review
task_id: delete-thread-notice
timestamp: 2026-09-25T08:03:49Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
React to the notice itself in the existing `messageCreate` stream: if it is the bot's own ThreadCreated message, delete it.

## Abstinence List (not added, intentional)
- History fetch after `startThread` — races the notice, one API call per thread.
- Retry on a failed delete — a permission miss would fail identically.
- Config switch — ADR 0001 makes the clean channel product-wide.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 30     | 38     | +27%  |

Budget fixed at Post-Flight (process miss, as in hermes-profile). Actual: text.js +9 (incl. import + 3 comment lines), bot +9 (incl. 2 comment lines), test +17, ADR +3.

## Anti-Pattern contrasted
`examples/anti-patterns/kitchen-sink-scaffold.md`.

## Simplify Triggers (detected)
**FIRED, marginally — +27% vs 30.** Comments and prettier's line split of the `catch` account for the overage; executable additions are 5 lines. No cut available without dropping the test cases the AC lists.
