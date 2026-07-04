---
artifact_type: simplicity_review
task_id: embed-anchor-summary
timestamp: 2026-07-04T14:06:25Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
One pure `extractLinkMeta(message, url)` reads {title, author, provider} off the matching Discord embed. `buildLinkPrompt` gains an optional `meta` arg: when present it prepends a short "this link is «title» by «author»; verify before summarising, else emit CONTENU_INACCESSIBLE" clause (meta=null stays byte-identical). `summarizeLink` threads meta through and, on seeing the sentinel in Hermes's reply, returns a fixed honest French message instead of a fabricated summary. The reaction handler extracts meta per link. No new module, no NLP, no bot-side semantic comparison — the ground truth is handed to Hermes and the only new control-flow is one sentinel check.

## Abstinence List (not added, intentional)
- Bot-side title-match verification (parse Hermes's stated title, fuzzy-compare to the embed) — parsing-fragile; deferred to a hardening follow-up
- A YouTube transcript-fetch capability — a separate, larger piece; this task only stops the wrong-summary, it doesn't manufacture content that isn't fetchable
- Applying the anchor to the @mention summary path too — kept scope to the reaction/link path
- A configurable sentinel / multiple failure messages — one constant + one French message is enough
- Fuzzy embed↔url matching by video-id — exact-url-or-single-embed covers the real cases; multi-embed-no-match → no anchor (safe fallback), not a wrong anchor

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     35 |     39 |    +4 |

Added logical LOC across prompts.js + text.js + hermes-cli.js + entrypoint + config.js. +11%,
under the +25% trigger. The bulk is the anchor prompt clause + the pure extractLinkMeta.

## Simplify Triggers (detected)
- None
