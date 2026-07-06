---
artifact_type: simplicity_review
task_id: no-embed-abstain
timestamp: 2026-07-06T06:20:26Z
complexity_score: 2
complexity_tier: STANDARD
---

## Simplest Possible Solution
Turn `buildLinkPrompt`'s anchor ternary's empty `else` branch into a title-free abstain
clause, and hoist the one sentence that names the sentinel into a shared `abstain` const so
both branches emit it identically. The meta-present branch stays byte-identical (it appends
`${abstain}` where the literal used to be, then keeps its "Ne résume jamais…" tail); the
no-meta branch gains just "Si tu ne peux pas accéder au contenu réel (…), ${abstain}". No new
sentinel, no bot-side change — `summarizeLink` already maps `CONTENU_INACCESSIBLE` →
`messagesFR.linkUnreadable`.

## Abstinence List (not added, intentional)
- A second sentinel / distinct no-embed token — reused the existing `LINK_UNREADABLE_SENTINEL`; `summarizeLink` keys off exactly one token.
- A `strict`/`abstain` config knob to toggle the clause — YAGNI; abstention is always desirable, never opt-out.
- Placeholder identity anchor when no title exists — nothing to match against; would be nonsensical and risk false abstentions.
- Bot-side "couldn't read" heuristic post-processing — no reliable CLI signal; the sentinel is the designed channel.
- Refactoring the whole prompt into a template builder — the ternary is already the right shape; only the empty branch needed filling.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     12 |     14 |    +2 |

## Simplify Triggers (detected)
- None. 14 logical LOC (prompts.js 4 — shared `abstain` const + filled else branch + reworded meta tail; test/prompts.test.js 10 — updated no-meta expected + new abstain-path test) vs 12 target = +16.7%, under the +25% trigger. The change fills one empty branch and extracts one shared sentence; the meta path stays byte-identical. Contrast with `examples/anti-patterns/god-object.md`: no new object, no new subsystem, no signature change.
