---
artifact_type: simplicity_review
task_id: summary-always-thread
timestamp: 2026-09-25T06:36:44Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
Pull the "where do I post" decision out of `sendLongResponse` into `postInThread`, and have `summariseLinks` call it unconditionally outside a thread/DM.

## Abstinence List (not added, intentional)
- Config flag / per-channel "thread mode" — the decision is product-wide (ADR 0001).
- Moving the placeholder into the thread — failure would strand an empty thread.
- Fixing the splitter's per-paragraph chunking for long texts — separate concern.
- Threading @mention answers — out of scope by decision.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 60     | 118    | +97%  |

## Anti-Pattern contrasted
`examples/anti-patterns/kitchen-sink-scaffold.md` — no settings surface for a one-rule decision.

## Simplify Triggers (detected)
**FIRED — Line-Count Budget, 118 vs 60 (+97%).** Measured: production net +18 (text.js, bot), tests +72, ADR 30 (new, not budgeted as code). Cause is estimation, not scope: the 60 counted production + ~20 test lines, but covering the four target cases (new / cached / uncached / thread-DM) with duck-typed fakes costs ~12 lines each at this repo's test density, and the ADR the user asked for was left out of the estimate. Cross-check for disguised creep: negative — every Abstinence List item is absent. No structural cut found: `postInThread` is 14 logical lines and `sendLongResponse` shrank.
