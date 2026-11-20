---
artifact_type: simplicity_review
task_id: summary-format
timestamp: 2026-07-03T10:21:01Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
One shared `buildSummaryFormat()` in prompts.js holding the one-shot structure with
adaptive labels. `buildLinkPrompt` interpolates it (drop-in for the old 📌/❓ line).
`buildAskPrompt` gains a `summarize` flag that appends it; `askHermes` forwards the
flag. The entrypoint sets `summarize = LINK_PATTERN.test(content)` on the @mention
path and enables web tools when true. No new module, no classifier, no config knob —
the format lives in exactly one function, reused by both paths.

## Abstinence List (not added, intentional)
- A separate summary-prompt module or a SummaryFormatter class — one function suffices
- A keyword/NLP intent classifier for "is this a summary request" — URL-presence is the clean signal; verbs already route to recap
- Applying the format in buildAskPromptWithContextFile (recap/offload path) — a recap is not a link summary
- A config toggle for the format text — YAGNI; edit the one function
- Reformatting the whole of CONTEXT.md / hermes-discord-bot.md to satisfy prettier-md — pre-existing drift, not in the enforced gate (eslint); would be doc scope bleed

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     28 |     26 |    -2 |

(buildSummaryFormat ~8, buildAskPrompt format branch ~2, buildLinkPrompt ~2, askHermes
option ~1, entrypoint wantsSummary ~3 logical; the rest is comments/tests/docs.)

## Simplify Triggers (detected)
- None
