---
artifact_type: simplicity_review
task_id: hermes-quiet-parse
timestamp: 2026-06-27T11:22:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
One pure `parseHermesOutput(stdout, stderr)` in prompts.js (next to extractThemes)
that returns `{response, sessionId}`: strip leading blank/`⚠ ` diagnostic lines
from stdout, read `session_id:` from stderr. The three call sites gain
`-Q --source tool`; both inline banner loops and `extractSessionId` are deleted.
Net −48 lines in the bot.

## Abstinence List (not added, intentional)
- No `--json`/structured-output abstraction — 0.17.0 doesn't offer it; `-Q` suffices
- No config flag to toggle banner vs quiet — quiet is now the only mode; a toggle is dead weight
- No retry/normalisation layer — out of scope; this task only swaps the extraction contract
- No move of unwrapText/splitAtBoundaries into prompts.js — separate backlog item (6115cc3)

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     18 |     15 |    -3 |

## Simplify Triggers (detected)
- None
