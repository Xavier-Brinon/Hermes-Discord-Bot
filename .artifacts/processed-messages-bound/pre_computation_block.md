---
artifact_type: pre_computation_block
task_id: processed-messages-bound
timestamp: 2026-06-25T21:05:08Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `PROCESSED_MESSAGES` exists only to suppress duplicate `messageCreate` events for messages the bot acts on | HIGH |
| 2 | Only two sites add to the set (`:577` mention/DM, `:808` link-summary); the sole reader is the guard `:564` | HIGH |
| 3 | Discord fires duplicate `messageCreate` events back-to-back, never after a long delay — so a short rolling window suffices for dedup | MEDIUM |
| 4 | A fixed cap of 1000 acted-on IDs is far larger than any realistic burst of duplicates, while staying trivially small in memory (~tens of KB) | MEDIUM |
| 5 | A JS `Set` preserves insertion order, so `values().next().value` is always the oldest entry (FIFO eviction is correct) | HIGH |

## Scope Declaration
### Files in scope
- hermes-discord-bot-clean.js — add a bounded `rememberMessage()` helper next to the `PROCESSED_MESSAGES` declaration; route the two `.add()` call sites through it

### Files off-limits
- prompts.js — prompt content, unrelated to dedup
- README.md / CLAUDE.md — no dedup behaviour documented to update
- the Hermes output parser (banner/`──` extraction) — untouched coupling point
- the `.has()` guard at :564 — read path is correct as-is; only the write path needs bounding

## Interpretations of the request
- "Bound the dedup structure" = cap memory growth while preserving same-tick duplicate suppression; the issue offers TTL-map OR fixed LRU, leaving the choice to the implementer
- Chosen reading: a fixed-capacity FIFO over the insertion-ordered `Set` — the simplest structure that satisfies all three acceptance criteria without timers or timestamps

## Alternatives considered
- TTL map (`Map<id, timestamp>` pruned by age) — rejected: needs `Date.now()` and either a periodic timer or prune-on-access scan; more moving parts than a size cap for the same guarantee
- True LRU (re-order on access) — rejected: dedup never re-reads an existing key (the guard returns early on hit), so recency-of-use is meaningless here; insertion-order FIFO is the right discipline
- Swap to a third-party LRU package (e.g. `lru-cache`) — rejected: YAGNI, adds a dependency for ~7 lines of logic (see `examples/anti-patterns/god-object.md`)

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -n "PROCESSED_MESSAGES" hermes-discord-bot-clean.js` | one decl + one `.has` + two `.add` | :19 decl, :564 has, :577 add, :808 add | 2026-06-25T21:04:00Z | PASS |
| 2 | `node -e "const s=new Set();s.add('a');s.add('b');console.log(s.values().next().value)"` | `a` (oldest first) | `a` | 2026-06-25T21:04:30Z | PASS |
