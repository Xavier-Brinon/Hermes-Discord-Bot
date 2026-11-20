---
artifact_type: change_boundary
task_id: stale-doc-refs
timestamp: 2026-07-06T19:54:23Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `CONTEXT.md` | "Link summary" entry (article/auto/denylist stale) + rename "Banner parsing" → `-Q` output parsing | modify |
| `CLAUDE.md` | Summary line + CLI-wrapper bullet (banner→`-Q`) + three-flows line (auto-article→📝-reaction) | modify |
| `.artifacts/stale-doc-refs/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/stale-doc-refs/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/stale-doc-refs/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/stale-doc-refs/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/stale-doc-refs/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- README.md — already accurate after the watchdog cleanup; no stale terms.
- hermes-discord-bot.md — verified free of the stale terms.
- all .js — the code is the source of truth and already correct; a docs fix must not touch it.

## Orthogonal Issues (noticed, skipped)
- CONTEXT.md is pre-existing prettier-dirty (unpadded tables, emphasis style) — a whole-file reformat is out of scope; new text matches the existing style.

## Orphan Tracking
- None. Docs-only prose edits; no imports/vars affected.
