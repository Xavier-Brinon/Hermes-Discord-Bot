---
artifact_type: pre_computation_block
task_id: unique-thread-titles
timestamp: 2026-07-05T09:50:06Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Discord's thread-name cap is 100 characters; staying ≤ 100 code points is safe (code points ≤ what Discord counts for BMP+astral). | HIGH |
| 2 | At the @mention call site (`:365`), `content` is the mention-stripped question text and is a good title source. | HIGH |
| 3 | At the link call site (`:431`), the first link's embed title (`extractLinkMeta(message, links[0]).title`) is the best available descriptive source; absent an embed it is null. | HIGH |
| 4 | Callers derive the title and pass it in; `sendLongResponse` stays dumb about derivation (issue's stated approach). | HIGH |
| 5 | The current static `'📄 Réponse détaillée'` is the correct fallback when no context string is available. | HIGH |
| 6 | A pathological single unbroken ≥100-char "word" (e.g. a giant token) essentially never occurs in French questions/embed titles, so an ellipsis-only degenerate output is acceptable and not worth a guard. | MEDIUM |
| 7 | The recap path (`:301`, `📊 Thèmes — …`) already builds a unique title and must stay untouched. | HIGH |

## Scope Declaration
### Files in scope
- `text.js` — new pure `buildThreadTitle(raw)` + `sendLongResponse` gains optional `threadTitle` param + export.
- `hermes-discord-bot-clean.js` — import `buildThreadTitle`; pass a derived title at the two `sendLongResponse` call sites (`:365` @mention, `:431` link).
- `test/text.test.js` — unit tests for `buildThreadTitle`.

### Files off-limits
- `config.js` — tempting to move the French title string into `messagesFR`, but that expands scope and the string already lived in `text.js`; keep it local (Orthogonal Issue).
- `recap.js` / entrypoint recap block (`:301`) — already builds a unique title; issue explicitly scopes this to `sendLongResponse`.
- `prompts.js`, `hermes-cli.js`, `cache.js` — unrelated to thread naming.

## Interpretations of the request
- **Primary:** every non-recap thread the bot opens should carry a title reflecting what it answers/summarises, truncated safely to Discord's cap, with the old static string as the fallback.
- **Alternate (rejected):** make `sendLongResponse` itself compute the title from `message.content`. Rejected — the two callers have *different* best sources (stripped question vs embed title), so derivation belongs at the call site, not in the shared sender.

## Alternatives considered
- **`.slice(0, n)` on the raw string** — rejected: can split a surrogate-pair emoji, violating "no mid-emoji break". `Array.from()` slices by code point instead.
- **Move the French strings to `config.messagesFR`** — rejected for this task: scope bleed; the literal already lived in `text.js`, so naming it there is the surgical move. Noted as an Orthogonal Issue.
- **Capture `links[0]`'s meta in the summarise loop to avoid a second `extractLinkMeta` call** — rejected: `extractLinkMeta` is pure and does only an in-memory array find (no I/O); a second call is trivially cheap and keeps the diff smaller. Noted as Orthogonal.
