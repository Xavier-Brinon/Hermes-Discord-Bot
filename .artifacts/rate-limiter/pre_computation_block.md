---
artifact_type: pre_computation_block
task_id: rate-limiter
timestamp: 2026-11-23T21:25:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | All live Discord-triggered Hermes calls enter through `hermes-discord-bot-clean.js` in three places: channel recap (`askHermes`), Q&A (`askHermes`), and `📝` link summaries (`summariseLinks` → `summarizeLink`). | HIGH |
| 2 | User-approved defaults are global max 2 concurrent Hermes calls (`MAX_CONCURRENT_HERMES = 2`) and per-user max 3 requests per 60 seconds (`USER_RATE_LIMIT_MAX = 3`, `USER_RATE_LIMIT_WINDOW_MS = 60000`), with `ADMIN_USER_ID` exempt from the per-user window. | HIGH |
| 3 | The bot runs as a single Node.js process (README §Watch points), so an in-memory concurrency counter and sliding-window Map require no external store. | HIGH |
| 4 | Releasing the concurrency slot in a `finally` block guarantees errors and timeouts can never leak slots. | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `git grep -n "askHermes\|summarizeLink" hermes-discord-bot-clean.js` | 3 call sites (recap, Q&A, summariseLinks) | lines 341, 434, 526 | 2026-11-23T21:24:30Z | PASS |
| 2 | User confirmation in session | max 2 concurrent, max 3/60s per user, admin exempt | User selected option 2 ("Global max 2 concurrent Hermes calls + per-user max 3 requests per 60s (admin exempt)") | 2026-11-23T21:16:00Z | PASS |
| 3 | Read `README.md` §Watch points | Single process | Confirmed: "Exactly one instance" | 2026-11-23T20:00:31Z | PASS |
| 4 | Code design review | `try { ... } finally { release(); }` wraps every acquired slot | Verified in `rate-limit.js` `acquire` + `release` contract | 2026-11-23T21:25:00Z | PASS |

## Scope Declaration
### Files in scope
- `rate-limit.js` — pure concurrency + per-user sliding-window limiter with injectable clock and idempotent `release()`.
- `config.js` — env-overridable `MAX_CONCURRENT_HERMES`, `USER_RATE_LIMIT_MAX`, `USER_RATE_LIMIT_WINDOW_MS`, and French `messagesFR.busy` / `messagesFR.rateLimited` replies.
- `hermes-discord-bot-clean.js` — gate recap, Q&A, and `📝` summary paths with `tryAcquire` / `finally release`.
- `test/rate-limit.test.js` — unit tests for concurrency cap, per-user window, expiry, admin exemption, idempotent release, and release-on-error.
- `test/modules.test.js` — smoke checks for `rate-limit.js` and new `config.js` exports.

### Files off-limits
- `hermes-cli.js` — stays unaware of Discord users and admin IDs.
- `cache.js` — rate state is transient in-memory, not persisted to disk.
- `package.json` — zero new dependencies.

## Interpretations of the request
- Primary: prevent a guild member from exhausting VPS CPU/RAM or Mistral API credits via rapid `@mentions`, recaps, or `📝` reactions by enforcing global concurrency (2) and per-user sliding window (3/60s, admin exempt), failing cleanly in French without spawning Hermes.

## Alternatives considered
- Putting the limiter inside `hermes-cli.js` — rejected: `hermes-cli.js` does not receive Discord `userId` or `isAdmin`, and gating in the entrypoint avoids pending messages / `yt-dlp` calls when rejected.
- Installing an npm rate-limiter (`p-limit`, `bottleneck`) — rejected: ~45 lines of zero-dependency JS is simpler and adds zero supply-chain surface.
- Queuing excess requests — rejected: queuing unbounded Discord bursts still holds memory and delays replies past user expectations; failing fast with a polite French busy message is predictable.
