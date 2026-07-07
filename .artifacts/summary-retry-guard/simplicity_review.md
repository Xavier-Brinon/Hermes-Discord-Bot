---
artifact_type: simplicity_review
task_id: summary-retry-guard
timestamp: 2026-07-07T13:15:02Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Split the one "done" set into two plain Sets: `REACTED_MESSAGES` (done — added ONLY after a
successful summary) and `SUMMARISING_MESSAGES` (in-flight — added in the guard, removed in a
`finally`). The handler guard returns early if the id is in either set, then wraps the attempt
so the id is marked done only when `summariseLinks` returns `true`. `summariseLinks` returns
`true` on success and `false` on total failure, and isolates each per-link `summarizeLink` in
its own try so one unreadable link no longer discards the summaries that succeeded — the batch
fails (returns `false`, DMs admin) only when every link throws.

## Abstinence List (not added, intentional)
- A value-carrying Map with an in-progress/done enum (Option A) — chose two single-meaning Sets; the `finally` cleanup is unconditional and needs no state machine.
- Retry-only-the-failed-links logic — re-reacting already retries a total failure; AC3 needs only "post what succeeded".
- A FIFO eviction bound on `SUMMARISING_MESSAGES` — it is transient and self-draining (add in guard, delete in `finally`); no 1000-entry cap needed.
- A config knob for max-links / retry policy — YAGNI; the 3-link cap and dedup behaviour are unchanged.
- Rethrow from `summariseLinks` + a re-catch in the handler — kept the silent-fail contract and used a boolean return instead.
- An admin DM on PARTIAL failure — the user still got a useful result; per-link failures are logged to console, and a partial-notify policy is a separate enhancement.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     14 |     14 |     0 |

## Simplify Triggers (detected)
- None. 14 logical LOC: 1 (the `SUMMARISING_MESSAGES` const) + 6 (per-link try/catch + `firstError` + the all-failed `throw` + two `return` lines in `summariseLinks`) + 7 (the handler's split guard, `add`, `try`/`if-success`/`finally`/`delete`). At Target = +0%, well under the +25% trigger. Contrast with `examples/anti-patterns/bloated-loop.md`: no ghost retry-counter flag, no defensive re-loop — the per-link try just collects successes and remembers the first error for the admin DM.
