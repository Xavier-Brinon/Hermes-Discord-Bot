---
artifact_type: simplicity_review
task_id: strip-reading-progress
timestamp: 2026-07-03T14:04:43Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Add one named regex constant and one `.filter()` on the `stdout.split('\n')` line
inside parseHermesOutput, dropping any line matching `/^\s*(?:📄|📖) Reading /u`.
Everything downstream (the leading blank/⚠ skip loop, the clarify regex, the
session-id extraction) is unchanged. No new function, no options, no config.

## Abstinence List (not added, intentional)
- Leading-only variant / new skip-loop branch — the line-wise `.filter` is simpler AND handles interleave; a second mechanism would be more code for less coverage
- A general "tool-progress" abstraction (list of emoji patterns, pluggable strippers) — YAGNI; there is exactly one trace shape to strip today
- Normalising/whitelisting emoji, Unicode-property classes — the two literal emoji in a `u`-flagged alternation are enough and are self-documenting
- Touching hermes-cli.js call sites — they inherit the fix through parseHermesOutput's return; changing them would be scope bleed

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      4 |      3 |    -1 |

(Logical LOC of the production change in prompts.js: the `const READING_TRACE` regex, the `.filter(...)` on the split, and the guard predicate — comments excluded.)

## Simplify Triggers (detected)
- None
