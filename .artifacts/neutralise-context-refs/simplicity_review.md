---
artifact_type: simplicity_review
task_id: neutralise-context-refs
timestamp: 2026-11-18T15:42:04Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
One regex replace, `(?<![\w/])@(?=[A-Za-z])` to `＠`, applied to Discord text at the two places in hermes-cli.js where prompts are built.

## Abstinence List (not added, intentional)
- Per-kind allow/deny lists: Hermes's plugin pattern makes any `@word:` a ref.
- Sanitising at every caller in the entrypoint: one choke point is enough and cannot be forgotten by a new caller.
- Logging of neutralised refs.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 50 (source 8, tests 42) | 92 (source 8, tests 84) | +84% |

## Simplify Triggers (detected)
- Tests over budget (84 vs 42). Recorded, not cut: the file carries JS copies of Hermes's two reference patterns (so the tests check against what Hermes matches, not against our own regex), a fake-Hermes harness that records the received prompt (the first version echoed it back and was blind for summarizeLink, caught by mutation check), and two fixture lists. Source stayed at budget (8).
