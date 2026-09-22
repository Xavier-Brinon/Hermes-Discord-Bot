---
artifact_type: simplicity_review
task_id: summary-questions
timestamp: 2026-09-22T19:00:50Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
Prompt asks for numbered, one-per-line points and questions. A pure `splitQuestions` cuts the questions block off each summary (null on anything unexpected → post as today). The bot posts the body as before, then each question as a `❓` reply to the last summary message, recording the summary's Hermes session on each with the existing `recordSession`. A reply to a `❓` message is prefixed with the question before the normal Q&A path runs — which already resumes by reply (244bad7).

## Abstinence List (not added, intentional)
- Reply-chain walking; a questionId→text store; JSON output from Hermes.
- Changing unwrapText markers.
- A reaction trigger on questions (user declined).
- Recording the summary message itself for replies (not asked; possible follow-up).
- A link-summary eval runner.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|    150 |    177 |  +18% |

Breakdown: prompts.js ~+40, hermes-cli.js ~+6, bot ~+30, tests ~+75 (9 cases), CONTEXT.md ~0 net.

## Simplify Triggers (detected)
- None fired (+18%, under the +25% trigger). Over the target mostly in the bot (+50 net vs ~30): prettier exploded the prompts import (7 lines) and the askHermes call once its first argument became a ternary, and `postQuestions` is wrapped best-effort (try/catch) — a failure after the summary is posted must not run the caller's delete-the-summary error path. prompts.js +54 vs ~40: the format string grew by its example lines. No Abstinence List item in the diff.
