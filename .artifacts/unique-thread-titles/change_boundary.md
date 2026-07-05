---
artifact_type: change_boundary
task_id: unique-thread-titles
timestamp: 2026-07-05T09:50:06Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | New pure `buildThreadTitle(raw)` + `DEFAULT_THREAD_TITLE`/`THREAD_TITLE_MAX` consts; `sendLongResponse` gains optional `threadTitle`; export `buildThreadTitle` | modify |
| `hermes-discord-bot-clean.js` | Import `buildThreadTitle`; pass a derived title at `:365` (@mention → stripped question) and `:431` (link → first embed title) | modify |
| `test/text.test.js` | `buildThreadTitle` unit tests (short passthrough, truncation, emoji-safe, fallback, whitespace collapse) | modify |
| `.artifacts/unique-thread-titles/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/unique-thread-titles/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/unique-thread-titles/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/unique-thread-titles/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/unique-thread-titles/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- `config.js` — the fallback title string could live in `messagesFR`, deferred to avoid scope bleed (string already lived in `text.js`).
- `recap.js` / entrypoint recap block (`:301`) — already builds a unique `📊 Thèmes — …` title; explicitly out of scope.
- `prompts.js`, `hermes-cli.js`, `cache.js` — no thread-naming concern.

## Orthogonal Issues (noticed, skipped)
- The link path re-calls `extractLinkMeta(message, links[0])` for the title while the summarise loop already calls it per link — a cheap in-memory duplicate; not worth a shared variable in this diff.
- French thread-title strings arguably belong in `config.messagesFR` for consistency with `linkUnreadable`; deferred (different concern).
- A mention that carries a URL shows the raw URL in the title; acceptable, no special-casing.

## Orphan Tracking
- None expected — `buildThreadTitle` is wired to both call sites; `sendLongResponse`'s old literal becomes the named default (not orphaned).
