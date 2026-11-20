---
artifact_type: simplicity_review
task_id: hermes-call-timing
timestamp: 2026-10-05T10:17:09Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
A pure formatter plus a tiny `startTiming` closure, called once per existing exit branch. The read-out is a shell pipeline in the README, not code in the repo.

## Abstinence List (not added, intentional)
- Stats script in the repo: the read-out is occasional, and a grep/awk pipeline needs nothing deployed.
- In-process aggregation or a metrics endpoint: the bot has no HTTP server; the issue asks for logs.
- Removing or rewording the existing `📥` / `❌` lines: other runbooks grep for them.
- Timing the yt-dlp transcript fetch: it is not a Hermes call (it has its own timeout).

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 60     | 75     | +25%  |

hermes-cli.js +33 (formatter 7 incl. 2 comment lines, startTiming 6 incl. 1 comment, 6 call lines, flow option + comment edits), bot +1, test +20 (prettier expanded one call to 7 lines), README +26 (the awk read-out is 10 of them).

## Anti-Pattern contrasted
`examples/anti-patterns/kitchen-sink-scaffold.md`.

## Simplify Triggers (detected)
**FIRED, then acted on.** The first draft was 91 lines (+52%): two prettier-expanded 11-line `logTiming` closures, identical apart from their arguments. Folding them into `startTiming(flow, web, limitMs)` brought it to 75 (+25%, at the threshold, not over it). No further cut without dropping the README read-out the AC requires.
