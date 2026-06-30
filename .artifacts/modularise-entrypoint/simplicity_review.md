---
artifact_type: simplicity_review
task_id: modularise-entrypoint
timestamp: 2026-06-30T17:06:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
Cut the entrypoint along the issue's five seams by relocating existing code verbatim
into plain CommonJS modules: config.js (constants + env-overridable paths), hermes-cli.js
(the execFile wrapper), cache.js (the two Maps behind accessor functions), and grow the
existing text.js/recap.js with their feature-matching functions. The entrypoint keeps only
the Discord client, its `client`-coupled helpers (notifyAdmin, finalizeReaction), the
dedup set, and the two event handlers — now calling into the modules. The only intentional
behaviour deltas are the `askHermes` options object (issue requirement) and env-overridable
paths (df0d693). The module graph is a DAG with config as the leaf.

## Abstinence List (not added, intentional)
- No DI container / service-locator / class hierarchy — plain module exports, matching the repo
- No rewrite of the messageCreate handler logic — it stays, just calls modules
- No change to prompt/parse contracts (prompts.js untouched)
- No new runtime dependency
- No "fix while moving" of the 3 timeframe bugs — separate follow-up
- No config schema/validation lib — `process.env.X || default` is enough
- No caching abstraction — the two Maps + save-on-write accessors, nothing more

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|    280 |    365 |  +30% |

Methodology: added logical LOC (non-blank, non-comment) across all production files via
`git diff | awk` (tests excluded). NOTE: this is a 5-module split, so the count is
dominated by **verbatim relocation** (moved bodies count as additions in the new modules
while the entrypoint sheds ~400 lines). Genuinely new logic is ~30 LOC: env-override
defaults, the askHermes options-object destructuring, the cache accessor wrappers, and
the module import/export lines. A large number here is relocation, not new complexity.

## Simplify Triggers (detected)
- **Delta +30% over the 280 target (Actual 365).** Re-planned per `skills/simplicity.md`
  instruction 3 / failure-mode #2. The overage is **relocation volume across a 5-module
  split**, not new complexity: the bodies of askHermes (~80), summarizeLink (~35),
  fetchChannelHistory (~70), scanChannelForLinks (~18), sendLongResponse (~28),
  formatHermesResponse, the cache load/save, and messagesFR (~30) all count as additions
  in their new modules while the entrypoint shed 433 lines (748→386). Genuinely new logic
  is ~30 LOC (env-override defaults, the askHermes options-object destructuring, the cache
  accessor wrappers, and the import/export lines). No abstraction was introduced (see
  Abstinence List). Net structural effect is a large *reduction* in the entrypoint.
