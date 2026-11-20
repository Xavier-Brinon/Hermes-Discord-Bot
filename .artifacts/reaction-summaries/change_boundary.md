---
artifact_type: change_boundary
task_id: reaction-summaries
timestamp: 2026-07-04T07:33:11Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Add pure `extractArticleLinks(content)` + a global copy of `LINK_PATTERN`; export it | modify |
| `config.js` | Add `SUMMARY_REACTION = '📝'` constant + export | modify |
| `hermes-discord-bot-clean.js` | Add `Partials` + `GuildMessageReactions`, fix `'CHANNEL'`; add `messageReactionAdd` handler + `summariseArticleLinks`; remove the auto-detect-link block; swap the `isNonArticleUrl` import for `extractArticleLinks` | modify |
| `test/text.test.js` | Unit tests for `extractArticleLinks` | modify |
| `.artifacts/reaction-summaries/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/reaction-summaries/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/reaction-summaries/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/reaction-summaries/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/reaction-summaries/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- `hermes-cli.js` — `summarizeLink` reused unchanged; reply flow is Discord-I/O, stays in entrypoint
- `prompts.js` — summary format unchanged
- `recap.js`, `cache.js` — unrelated; `setCachedLink` reused as-is
- entrypoint @mention/DM Q&A + recap handlers — untouched; only the trailing auto-detect block is removed

## Orthogonal Issues (noticed, skipped)
- The bounded-FIFO idiom (`PROCESSED_MESSAGES` + `rememberMessage`) is duplicated by the new `REACTED_MESSAGES` + `rememberReaction`; a shared factory is a separate refactor (would touch the working messageCreate path)
- `message.content.replace(LINK_PATTERN, '')` for context strips only the first URL (non-global) — pre-existing quirk carried over verbatim from the removed block; not this task
- The former "up to 3 links" comment was dead (non-global `match` returned ≤1 link); `extractArticleLinks` makes it real — new-path-only, documented in the PCB, no regression

## Orphan Tracking
- `isNonArticleUrl` import in the entrypoint — becomes unused once the auto-detect block is removed (its only entrypoint caller); **remove** from the entrypoint import (still exported by text.js, used internally by `extractArticleLinks` + covered by tests)
