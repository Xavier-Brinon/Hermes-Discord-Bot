---
artifact_type: adherence_report
task_id: diagnostic-pitfalls
timestamp: 2026-08-13T14:33:55Z
complexity_score: 0
complexity_tier: TRIVIAL
---

## Skills fired
- [ ] A  [ ] B  [ ] C  [x] D  (TRIVIAL — Skill D only, per orchestrator tier mapping)

## Artifacts produced
- verification_matrix: .artifacts/diagnostic-pitfalls/verification_matrix.md

Note: `scope-adherence.sh` was run and declined (`change_boundary.md not found`), which is
expected — Skill C does not fire at TRIVIAL, so no Change Boundary exists. This report is
self-attested, matching the `catch-hygiene` precedent.

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     0 | One additive section: a 5-row term table plus a 4-item description list. No restructuring of the file, no new headings elsewhere, no cross-references added. |
| Scope Bleed      |     0 | `waysofworking.org` only. `git diff --numstat` = `25 0`, so zero pre-existing lines were modified or removed. CLAUDE.md, CONTEXT.md and the vendored `skills/` tree untouched. |
| Style Drift      |     1 | **Intentional, recorded.** The new section follows the org style guide (no em-dashes, `- Term :: explanation` description lists); the surrounding vendored prose uses both forbidden shapes. Rationale in the Verification Matrix §Deviation. |

## Metrics
- Reflex Rate: PASS (TRIVIAL — minimal matrix, no over-engineering)
- Scope Adherence: 100%

## Verification summary
- `* Diagnostic pitfalls` heading present (1 match); 5 terms; 4 `::` rules.
- Org style of authored lines: 0 em-dashes, 0 markdown `**bold**`, 0 trailing whitespace. The one
  `---` hit is the org table separator row, which is table syntax rather than prose.
- No project-specific content leaked into the vendored file: 0 hits for hermes/VPS/discord.
- `lint-frontmatter.sh .artifacts/diagnostic-pitfalls` → exit 0.
- Diff is purely additive: 25 added, 0 removed, 1 file.
- Issue lifecycle: PENDING — comment precedes `rad issue state --solved`.
