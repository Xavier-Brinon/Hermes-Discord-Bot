---
artifact_type: simplicity_review
task_id: unique-thread-titles
timestamp: 2026-07-05T09:50:06Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Add one pure helper `buildThreadTitle(raw)` in `text.js` that prefixes `📄 `, collapses
whitespace, and truncates to 100 code points on a word boundary (falling back to the current
static `'📄 Réponse détaillée'` when `raw` is empty). Give `sendLongResponse` an optional
third param `threadTitle` defaulting to that same static string and use it as the thread name.
Each of the two callers passes `buildThreadTitle(<its best source>)`: the mention path passes
the stripped question, the link path passes the first link's embed title.

## Abstinence List (not added, intentional)
- **No config knob / options object** — the title is derived positionally; no `{ prefix, maxLen }` settings.
- **No new French string in `config.js`** — reused the existing literal in place as a named const; did not migrate `messagesFR`.
- **No per-caller title-builder variants** — one `buildThreadTitle(raw)` serves both sources; the callers differ only in what `raw` they pass.
- **No URL-stripping / smart summarisation of the question** — the mention path passes `content` verbatim; a question that embeds a URL just shows it (still more descriptive than the static string).
- **No grapheme-cluster (Intl.Segmenter) splitting** — code-point truncation via `Array.from` is enough to keep emoji whole; full grapheme clustering is YAGNI here.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     14 |     17 |  +3 (+21%, under the +25% trigger) |

(Logical LOC, production only, counted post-code from the diff: `text.js` = 2 consts + 11-line
`buildThreadTitle` (incl. braces) + 1 export + 1 modified signature (net 0) + 1 modified `name:`
(net 0) = 15 new; `hermes-discord-bot-clean.js` = 1 import + 1 `threadTitle` line (the two
`sendLongResponse` calls are modifications, net 0) = 2 new. Total 17.)

## Simplify Triggers (detected)
- None.

## Anti-Pattern contrast
Avoiding `examples/anti-patterns/god-object.md`: `buildThreadTitle` is one pure function, not a
"TitleFormatter" object accreting prefix/locale/emoji-policy config. It takes a string, returns a
string.
