---
artifact_type: simplicity_review
task_id: processed-messages-bound
timestamp: 2026-06-25T21:05:08Z
complexity_tier: STANDARD
complexity_score: 3
---

## Simplest Possible Solution
Add one named cap `MAX_PROCESSED_MESSAGES = 1000` and a four-line `rememberMessage(id)`
helper that adds the id, then — if the set has grown past the cap — deletes its oldest
entry (the first value, since a `Set` keeps insertion order). Route the two existing
`PROCESSED_MESSAGES.add(message.id)` call sites through the helper. The `.has()` guard
is unchanged. No timers, no timestamps, no new dependency.

## Abstinence List (not added, intentional)
- TTL/age-based expiry — a size cap gives the same "no unbounded growth" guarantee without `Date.now()` or a sweep timer
- Configurable cap via env var — YAGNI; one consumer, a constant reads better
- Third-party LRU library — adds a dependency for ~7 lines (`examples/anti-patterns/god-object.md`)
- Re-ordering on access (true LRU) — meaningless here; the guard never re-reads a hit, so insertion order is the only order that matters
- A class/wrapper around the Set — accretion disguised as API; a free function over the existing module-level Set is enough

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      8 |      7 |    -1 |

## Simplify Triggers (detected)
- None
