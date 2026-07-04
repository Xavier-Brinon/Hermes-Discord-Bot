---
artifact_type: change_boundary
task_id: reaction-any-link
timestamp: 2026-07-04T10:50:15Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Remove `NON_ARTICLE_PATTERN` + `isNonArticleUrl` + `extractArticleLinks`; add pure `extractLinks`; fix header comment + exports | modify |
| `hermes-discord-bot-clean.js` | Reaction handler uses `extractLinks` (silent on 0 links); rename `summariseArticleLinks` → `summariseLinks`; drop non-article wording | modify |
| `test/text.test.js` | Remove `isNonArticleUrl` + `extractArticleLinks` suites; add `extractLinks` suite | modify |
| `test/modules.test.js` | Swap `isNonArticleUrl` → `extractLinks` in the text export-check list | modify |
| `config.js` | Update the comment that name-drops `NON_ARTICLE_PATTERN / isNonArticleUrl` | modify |
| `.artifacts/reaction-any-link/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/reaction-any-link/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/reaction-any-link/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/reaction-any-link/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/reaction-any-link/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- hermes-cli.js, prompts.js, recap.js, cache.js — no denylist references
- @mention/DM Q&A + recap handlers — already unfiltered, unchanged
- `ALL_LINKS_PATTERN` in text.js — kept; `extractLinks` reuses it

## Orthogonal Issues (noticed, skipped)
- The `message.content.replace(LINK_PATTERN, '')` context-strip in summariseLinks removes only the first URL (non-global) — pre-existing, carried over; not this task
- config.js was already prettier-dirty on HEAD (two `aujourd'hui` apostrophe lines) — untouched

## Orphan Tracking
- `NON_ARTICLE_PATTERN`, `isNonArticleUrl`, `extractArticleLinks` — become unused by this change; **remove** (that IS the change). Confirmed via grep that no other production caller exists.
- `messagesFR` import in text.js — still used by `formatHermesResponse`; keep.
