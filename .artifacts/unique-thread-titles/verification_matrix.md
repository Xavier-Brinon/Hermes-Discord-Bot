---
artifact_type: verification_matrix
task_id: unique-thread-titles
timestamp: 2026-07-05T09:50:06Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Short title passthrough | `buildThreadTitle('Comment marche Raft ?')` === `'📄 Comment marche Raft ?'` (prefixed, unchanged) | unit test | PASS |
| Long title truncates ≤ 100 | For a >100-char input, `Array.from(result).length <= 100` and result ends with `…` | unit test | PASS (eyeballed: 155-char question → 95 cp, ends "…systèmes…") |
| Word-boundary cut | Truncation of a normal French sentence does not end mid-word (`endsWith('mot…')` for a `'mot '`-repeated input) | unit test | PASS |
| Emoji-safe truncation | A long emoji input keeps the last char a whole emoji (`result.endsWith('😀…')`, never a lone surrogate) | unit test | PASS |
| Empty / whitespace fallback | `buildThreadTitle('')`, `'   '`, `null`, `undefined` all === `DEFAULT_THREAD_TITLE` (`'📄 Réponse détaillée'`) | unit test | PASS |
| Whitespace collapse | `buildThreadTitle('Para un.\n\n  Para deux.')` === `'📄 Para un. Para deux.'` | unit test | PASS |
| `sendLongResponse` default unchanged | Third param defaults to `DEFAULT_THREAD_TITLE` = the prior literal; no-arg callers name the thread identically | code review of diff | PASS (default equals former literal; `name:` reads the param) |
| Two call sites distinct | @mention thread name derives from `content` (question); link thread name derives from `extractLinkMeta(...).title` — different sources | code review (integration; needs Discord) | PASS (wiring reviewed; runtime = deploy-time) |
| Recap path untouched | `git diff` shows no change to the `📊 Thèmes — …` block (`:301`) | git diff | PASS (diff touches only `:365`/`:431` call sites + import) |
| Suite green | `npm test` passes; `eslint .` 0 errors; prettier clean on changed lines | command output | PASS (85/85; eslint 0 errors/4 pre-existing warnings; prettier clean) |
