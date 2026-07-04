---
artifact_type: change_boundary
task_id: embed-anchor-summary
timestamp: 2026-07-04T14:06:25Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Pure `extractLinkMeta(message, url)` from the matching embed + export | modify |
| `prompts.js` | `LINK_UNREADABLE_SENTINEL` const; `buildLinkPrompt(url, context, meta)` anchor/verify/sentinel; export sentinel | modify |
| `hermes-cli.js` | `summarizeLink(url, context, meta)` threads meta; sentinel → `messagesFR.linkUnreadable` | modify |
| `hermes-discord-bot-clean.js` | `summariseLinks` extracts meta per link and passes it; import `extractLinkMeta` | modify |
| `config.js` | `messagesFR.linkUnreadable` honest French abstention | modify |
| `test/text.test.js` | `extractLinkMeta` unit tests | modify |
| `test/prompts.test.js` | `buildLinkPrompt` anchor + meta=null byte-identical tests | modify |
| `.artifacts/embed-anchor-summary/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/embed-anchor-summary/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/embed-anchor-summary/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/embed-anchor-summary/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/embed-anchor-summary/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- recap.js, cache.js — unrelated
- the @mention Q&A summary path (buildAskPrompt) — anchor is scoped to the reaction/link path
- parseHermesOutput — unchanged; sentinel detection lives in summarizeLink

## Orthogonal Issues (noticed, skipped)
- config.js + modules.test.js were already prettier-dirty on HEAD (apostrophe / long-array lines) — leave untouched
- The actual reliability of Hermes obeying the abstain instruction can't be unit-tested locally (no Hermes CLI) — verified on deploy; eval follow-up

## Orphan Tracking
- None expected (all new symbols are wired to a caller).
