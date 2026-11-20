---
artifact_type: pre_computation_block
task_id: neutralise-context-refs
timestamp: 2026-11-18T15:42:04Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Hermes expands `@file:/@folder:/@git:/@url:/@diff/@staged` and plugin `@<word>:` refs found anywhere in a `-q` query, under cwd `/data/workspace`, and `.env.keys` is not deny-listed. | HIGH |
| 2   | A ref only matches when `@` is not preceded by a word char or `/` and is followed by a letter; Hermes does not Unicode-normalise before matching, so `＠` (U+FF20) never matches. | HIGH |
| 3   | Every Hermes call that carries Discord-sourced text goes through `askHermes` or `runLinkSummary`; the bot's own `@file:` offload is added by `buildAskPromptWithContextFile` after the question. | HIGH |
| 4   | Expanded file content is not re-parsed for refs, so sanitising the context before writing the offload file is enough. | MEDIUM |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | live Discord `@file:.env.keys` on prod (incident) | file inlined | model: « le contenu que tu as collé … fait déjà partie de l'historique » | 2026-11-18T15:37:00Z | PASS |
| 2   | read `agent/context_references.py:76-83`; `grep normalize` | pattern as stated; no normalisation | `(?<![\w/])@(?:(?P<simple>diff\|staged)\b\|(?P<kind>file\|folder\|git\|url):…)`, plugin `@[a-zA-Z][\w-]*:`; no normalize | 2026-11-18T15:40:00Z | PASS |
| 3   | `grep -n "execFile" hermes-cli.js`; read askHermes / runLinkSummary | 2 prompt-carrying calls | askHermes, runLinkSummary (+ probeHermes, no prompt) | 2026-11-18T15:41:00Z | PASS |
| 4   | live recap after deploy | recap posted | not run | — | PENDING |

## Scope Declaration

### Files in scope
- `prompts.js`: pure `neutraliseContextRefs(text)`.
- `hermes-cli.js`: apply it to question/extraContext in askHermes and to the link prompt in runLinkSummary.
- `test/prompts.test.js`: unit tests against JS copies of Hermes's patterns.
- `test/hermes-cli-refs.test.js` (new): end-to-end through a fake HERMES_BIN.

### Files off-limits
- `hermes-discord-bot-clean.js`, `recap.js`: callers unchanged, the choke point is hermes-cli.js.
- The e39e496 work (stashed on `issue/in-process-decrypt`).

## Interpretations of the request
- "Neutralise" = keep the text readable for the model (swap `@` for `＠`), not delete it.

## Alternatives considered
- Strip refs entirely: loses meaning in legitimate text ("@everyone", handles).
- Ask upstream to deny-list `.env.keys`: worth doing, but `@folder:`, `@url:` and other files stay open.
- Run Hermes with a cwd outside the workspace: breaks the recap offload (needs the file under cwd) and `@url:` stays.
