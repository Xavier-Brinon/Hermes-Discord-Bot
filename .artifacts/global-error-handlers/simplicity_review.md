---
artifact_type: simplicity_review
task_id: global-error-handlers
timestamp: 2026-06-30T20:56:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
One small `safeReply(message, content)` helper in text.js that awaits `message.reply`
inside a try/catch and logs on failure, returning `null`. The four un-awaited replies in
the entrypoint become `await safeReply(...)`. Four event registrations are added near the
existing `client.on` handlers: `client.on('error')` and `client.on('shardError')` log only;
`process.on('unhandledRejection')` and `process.on('uncaughtException')` log and call the
existing `notifyAdmin`, without exiting. No new module, no new dependency, no config knob.

## Abstinence List (not added, intentional)
- `notifyAdmin` throttling / rate-limit — YAGNI; the global net is a last resort, not a hot path
- `process.exit(1)` on uncaughtException — re-introduces the restart churn this issue removes
- A reusable `withErrorHandling` decorator over every handler — over-abstraction for 4 call sites
- Restructuring the two per-message `catch` blocks (question / link-summary) — already correct; out of scope
- Logging library / structured logging — repo uses `console.error`; stay consistent

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     22 |     21 |    -1 |

## Simplify Triggers (detected)
- None
