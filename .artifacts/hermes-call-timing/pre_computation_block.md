---
artifact_type: pre_computation_block
task_id: hermes-call-timing
timestamp: 2026-10-05T10:14:51Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Every Hermes call goes through askHermes or runLinkSummary; probeHermes is a startup probe, not a call to time. | HIGH |
| 2   | `error.killed` is how execFile reports its own timeout, so it separates timeout from error (the code already uses it for the French message). | HIGH |
| 3   | pm2 logs prefix each line (`0\|hermes-d \| `), so the read-out must match on `key=value` fields, not on line start. | HIGH |
| 4   | The VPS has grep, sed, sort and awk (Debian-based node image). | HIGH |

## Scope Declaration

### Files in scope
- `hermes-cli.js`: **modify**. Pure `formatTimingLine`, one call per exit path, `flow` option on askHermes.
- `hermes-discord-bot-clean.js`: **modify**. Recap call passes `flow: 'recap'`.
- `test/hermes-cli.test.js`: **modify**. formatTimingLine cases.
- `README.md`: **modify**. §Health check percentile command.

### Files off-limits
- `config.js` (timeouts unchanged), `prompts.js`, `text.js`, `youtube.js` (the transcript fetch is not a Hermes call).

## Interpretations of the request
1. **(Chosen)** Log line + a shell read-out (grep/sed/sort/awk) documented in the README. Nothing new to deploy or maintain.
2. (Rejected) A committed stats script in the repo. More code to keep, for an occasional read-out.
3. (Rejected) In-process aggregation or a metrics endpoint. The bot has no HTTP server and the issue asks for logs.

## Gold Standard cited
`examples/patterns/surgical-diff.md`.
