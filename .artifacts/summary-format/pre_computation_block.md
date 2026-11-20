---
artifact_type: pre_computation_block
task_id: summary-format
timestamp: 2026-07-03T10:21:01Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The liked format (intro + Thèse centrale + Arguments clés + Questions) is NOT in the repo — the only summary template is buildLinkPrompt's 📌/❓. Verified by grep: no "thèse/arguments/provocatrices" template anywhere in *.js. | HIGH |
| 2 | The `discord-bot` Hermes profile (which likely shaped the emergent format) lives on the VPS, outside this repo — so the durable fix is to encode the format in prompts.js (the source of truth the bot AND evals import). | HIGH |
| 3 | prompts.js function declarations are hoisted, so buildAskPrompt/buildLinkPrompt can call buildSummaryFormat regardless of definition order. | HIGH |
| 4 | On the @mention path, French summary verbs (résume/récap) are intercepted earlier by HISTORY_PATTERN (channel-recap) before reaching askHermes — so URL-presence is the reliable "summarise this" signal there. | MEDIUM |
| 5 | A link-summary @mention never hits the 96 KB argv-offload threshold, so buildAskPromptWithContextFile (which ignores summarize) is not on this path and needs no change. | MEDIUM |

## Scope Declaration
### Files in scope
- prompts.js — add buildSummaryFormat(); add `summarize` param to buildAskPrompt; rewire buildLinkPrompt; export buildSummaryFormat
- hermes-cli.js — askHermes gains a `summarize` option, forwarded to buildAskPrompt
- hermes-discord-bot-clean.js — @mention path: wantsSummary = URL in message → enable web tools + pass summarize
- test/prompts.test.js — update buildLinkPrompt byte-identity; add buildAskPrompt(summarize) + buildSummaryFormat cases; import the new export
- evals/assertions.js — hasLinkStructure keys off Thèse/Idée + Questions instead of 📌/❓
- CONTEXT.md, hermes-discord-bot.md — update the "Link summary" description

### Files off-limits
- buildAskPromptWithContextFile (prompts.js) — the recap/large-context path; a recap is not a link summary, and link summaries don't hit the offload threshold (Assumption 5)
- summarizeLink (hermes-cli.js) — already calls buildLinkPrompt, so it inherits the format for free; no change
- config.js / text.js / cache.js / recap.js — no summary-format surface

## Interpretations of the request
- "make the bot adopt this format systematically every time (a one-shot example)" = encode the structure as a reusable one-shot in prompts.js, applied wherever the bot summarises (both summary paths), NOT on general Q&A
- "adaptive" (from the design discussion) = the labels flex: Thèse centrale/Arguments clés for argumentative content, Idée principale/Points clés for neutral news — so a non-argumentative article isn't forced to invent a thesis

## Alternatives considered
- Put the format only in buildLinkPrompt (bare-link path) — rejected: the user's liked summaries came via @mention, which would stay unformatted (approved scope is "both")
- Force the format on every buildAskPrompt reply — rejected: corrupts general Q&A ("quel temps fait-il ?" must never get a "Thèse centrale")
- Detect summary intent via a keyword classifier — rejected: French summary verbs already route to recap; URL-presence is the clean, low-false-positive signal that actually reaches askHermes

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -rniE "thèse\|provocatri" --include=*.js .` (pre-change) | no template match | none | 2026-07-03T10:21:01Z | PASS |
| 2 | `node -e "buildAskPrompt('Q',null) === <old literal>"` | true (plain Q&A unchanged) | true | 2026-07-03T10:21:01Z | PASS |
| 3 | `grep -n "summarize: wantsSummary" hermes-discord-bot-clean.js` | present | line 326 | 2026-07-03T10:21:01Z | PASS |
