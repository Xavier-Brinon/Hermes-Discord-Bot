---
artifact_type: simplicity_review
task_id: dm-admin-gate
timestamp: 2026-11-18T14:00:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
One pure predicate `isAdmin(authorId, adminId)` in `text.js`, one early `return` in the entrypoint for DMs that fail it, and one pure `buildAskArgs(prompt, sessionId)` in `hermes-cli.js` that replaces the two positional splices and always includes `-t web`.

## Abstinence List (not added, intentional)
- French refusal reply to strangers — the issue says ignore silently; a reply confirms the bot is reachable.
- Allow-list env var of several user IDs — one admin today.
- Logging of ignored DMs — a stranger could fill the log.
- Toolset config constant — one value, one caller.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 70     | 53     | -24%  |

Added logical lines (non-blank, non-comment) from `git diff -U0` over the 5 code/test files: source 20, tests 33.

## Simplify Triggers (detected)
- None. The refactor removed the two positional splices, so `buildAskArgs` replaced code rather than adding a branch.
