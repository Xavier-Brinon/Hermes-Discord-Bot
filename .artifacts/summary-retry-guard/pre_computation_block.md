---
artifact_type: pre_computation_block
task_id: summary-retry-guard
timestamp: 2026-07-07T13:15:02Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `summariseLinks` has exactly one caller (the `messageReactionAdd` handler, :511), so changing its return from `undefined` → `boolean` breaks no other call site | HIGH |
| 2 | `summariseLinks` today swallows every error (catch at :444 does NOT rethrow), so the caller currently cannot tell success from failure — a boolean return is the minimal signal that lets the handler mark done only on success | HIGH |
| 3 | The guard (`REACTED_MESSAGES.has ‖ SUMMARISING_MESSAGES.has`) and the set (`SUMMARISING_MESSAGES.add`) are separated only by synchronous code (`extractLinks`, an `if`), so check-and-set is atomic w.r.t. the event loop — the second of two concurrent reactions sees the in-flight id and returns (this is the SAME atomicity the current mark-before-attempt already relies on) | HIGH |
| 4 | Marking done only on success + an in-flight set closes the double-post race identically to the current mark-before-attempt placement — no double-post regression (AC2) | HIGH |
| 5 | Isolating each `summarizeLink` in its own try and posting the non-empty `summaries` still reaches `finalizeReaction(true)`; a partial success is treated as done (not retryable), which satisfies AC3 ("posts the links that succeeded") — only a TOTAL failure (every link threw) falls through to the admin-DM path and stays retryable | MEDIUM |
| 6 | The 4 pre-existing eslint empty-catch warnings (:139, :451, :458, :460) belong to issue cb42d9b and are off-limits; my new `catch (err)` consumes `err`, so it adds no new warning | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -n "summariseLinks" hermes-discord-bot-clean.js` | one definition (:409) + one call (:511) | def :409, call :511 — single caller | 2026-07-07T13:15:02Z | PASS |
| 2 | read summariseLinks catch (:444–:477) | catch DMs admin, no `throw` | ends at `notifyAdmin(...)`; no rethrow | 2026-07-07T13:15:02Z | PASS |
| 3 | `npm test` | green baseline before change | 86/86 pass | 2026-07-07T13:15:02Z | PASS |
| 4 | `npx eslint hermes-discord-bot-clean.js` | 0 errors, 4 known warnings | 0 errors, 4 warnings (139/451/458/460) | 2026-07-07T13:15:02Z | PASS |

## Scope Declaration
### Files in scope
- hermes-discord-bot-clean.js — (a) add the `SUMMARISING_MESSAGES` in-flight Set; (b) split the handler guard into done-vs-in-flight and mark done only after a successful `summariseLinks`; (c) isolate each per-link `summarizeLink` in its own try + return `true`/`false` from `summariseLinks`

### Files off-limits
- hermes-cli.js — `summarizeLink`'s throw already carries `cliStdout`/`cliStderr`/`elapsed`; the admin-DM path consumes them unchanged
- config.js — no new `messagesFR` string; the existing failure/pending messages are reused
- prompts.js / text.js / recap.js / cache.js — unrelated to the reaction dedup + per-link isolation
- test/*.test.js — the handler lives in the non-exporting entrypoint (no `module.exports`, `client.login` at load); adding a unit test needs a testability refactor (extract the guard into a module) — a separate concern
- the 4 pre-existing empty-catch eslint warnings — issue cb42d9b, not this task

## Interpretations of the request
- Primary reading: implement the issue's Option B — keep `REACTED_MESSAGES` as the "done" set but add to it only on success, and guard concurrent attempts with a separate in-flight `SUMMARISING_MESSAGES` set; independently, isolate each link so one failure doesn't discard the batch.
- Alternate reading considered: the issue's Option A — one structure with two states (in-progress vs done), un-marked on failure. Rejected below.

## Alternatives considered
- **Option A: single set with an in-progress/done marker, un-marked on failure** — rejected: needs a value-carrying Map (or a second sentinel per id) and a mutate-on-failure step; two plain Sets, each with a single meaning ("done" / "in-flight"), read more clearly and the `finally` cleanup is unconditional.
- **Make `summariseLinks` rethrow instead of returning a boolean** — rejected: that breaks its documented "silent-fail, DM admin, never escape to the caller" contract, forcing the handler to re-add its own try/catch to swallow again. A boolean is a one-token success signal that keeps the contract intact.
- **Retry only the failed links inside the batch** — rejected: scope creep. AC3 asks only to post what succeeded; re-reacting already retries a total failure.
- **Bound `SUMMARISING_MESSAGES` with a FIFO like `REACTED_MESSAGES`** — rejected: the in-flight set is transient (added in the guard, removed in a `finally`); it self-drains to at most a handful of concurrent entries, so no eviction cap is needed.
