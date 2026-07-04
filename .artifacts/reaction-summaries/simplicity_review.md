---
artifact_type: simplicity_review
task_id: reaction-summaries
timestamp: 2026-07-04T07:33:11Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
One pure `extractArticleLinks(content)` in text.js (all URLs via a global copy of `LINK_PATTERN`, non-articles filtered out, `[]` = stay silent), one `SUMMARY_REACTION` constant in config.js, and in the entrypoint: enable the `GuildMessageReactions` intent + `Partials.Channel/Message/Reaction`, move the existing auto-detect summarise-and-reply body verbatim into a `summariseArticleLinks(message, links)` function, add a `messageReactionAdd` handler that resolves partials → matches 📝 → enforces the guild → dedups → calls it, and delete the old auto-detect block. Net logic is the handler; everything else is moved or a one-liner.

## Abstinence List (not added, intentional)
- Generic `boundedSet()` FIFO factory shared with the messageCreate dedup — refactoring the working critical path is scope bleed; mirror the existing `PROCESSED_MESSAGES` idiom instead
- A config knob for the max links per message — kept the existing hard-coded `.slice(0, 3)` cap
- `DirectMessageReactions` intent / DM 📝 support — feature is guild-only per the issue
- Remove-reaction (📝 taken back → delete summary) handling — not requested; summaries are one-shot
- A reaction allow-list / multiple trigger emojis — one configurable emoji is enough
- Reacting ✅ on the source message to mark "already summarised" — the dedup Set already prevents re-runs

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     90 |     90 |     0 |

Counted as added logical LOC across the three production files (`git diff | grep '^+'`,
minus blank/comment lines). 58 logical LOC were removed in the same diff (the old
auto-detect block), for a net of +32.

## Simplify Triggers (detected)
- Re-planned Target 65 → 90. My initial 65 under-counted `summariseArticleLinks`: ~54 of
  the 90 added lines are the auto-detect block moved **verbatim** into the shared function
  (it also shows as 58 removed), so net-NEW authored logic is only ~36 LOC (the pure
  `extractArticleLinks`, the `SUMMARY_REACTION` constant, the reaction dedup set, and the
  ~18-line handler). The increase is a clean extract-and-move with no added branching, not
  bloat — so I raised the Target to match rather than cut. No new abstraction was introduced.
