---
artifact_type: simplicity_review
task_id: timeout-web-aware
timestamp: 2026-06-24T21:38:00Z
complexity_tier: STANDARD
complexity_score: 3
---

## Simplest Possible Solution
Delete the dead `HERMES_CONFIG` object and replace it with three named, commented
constants — `TIMEOUT_NORMAL = 90000`, `TIMEOUT_WEB = 150000`, `TIMEOUT_RECAP =
120000`. Change `askHermes`'s default from `customTimeout || 60000` to
`customTimeout || (useWebTools ? TIMEOUT_WEB : TIMEOUT_NORMAL)`, so the slow web
path gets its own budget while plain Q&A gets the documented 90s. Point the
recap call site and `summarizeLink`'s hardcoded 60s at the named constants. No
new objects, functions, or config surface.

## Abstinence List (not added, intentional)
- Reviving `HERMES_CONFIG` as a config object — one consumer; a struct is indirection without payoff (`examples/anti-patterns/god-object.md`)
- Env-var / runtime configuration of timeouts — YAGNI; no second consumer asking for it
- A `clarify`-tool guard or interactive-clarify handling — explicitly a separate concern per issue side-note; not this task
- A retry/backoff wrapper around the timeout — out of scope; the bug is "budget too small", not "transient failure"
- Per-question adaptive timeout heuristics — over-engineering; two static buckets (web vs not) is the whole need

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      6 |      6 |     0 |

## Simplify Triggers (detected)
- None
