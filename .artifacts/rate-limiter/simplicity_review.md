---
artifact_type: simplicity_review
task_id: rate-limiter
timestamp: 2026-11-23T21:25:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
A single factory `createLimiter({ maxConcurrent, maxPerUser, windowMs, now })` in `rate-limit.js` tracking an integer `inFlight` count and a per-user timestamp `Map`, returning `{ ok: true, release }` (with an idempotent `release`) or `{ ok: false, reason: 'concurrency' | 'rate' }`. Wired into `hermes-discord-bot-clean.js` around recap, Q&A, and `📝` summaries with `try / finally`, replying in French when throttled.

## Abstinence List (not added, intentional)
- Request queue / FIFO backlog — YAGNI and risks unbounded memory under spam; fail fast instead.
- Disk persistence for rate-limit windows — a 60s window resets naturally on restart.
- External npm limiter dependency — ~45 lines of plain JS needs no package.
- Per-channel or per-flow separate rate buckets — one global concurrency cap + one per-user window is simpler and protects the single VPS.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|    160 |    158 |    -2 |

## Simplify Triggers (detected)
- None. Stays within budget (52 LOC in `rate-limit.js`, 71 LOC in `test/rate-limit.test.js`, ~35 net LOC in `config.js`, `hermes-discord-bot-clean.js`, and `test/modules.test.js`), zero dependencies added.
