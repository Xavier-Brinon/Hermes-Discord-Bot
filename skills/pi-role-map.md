# Pi Role Map — Framework Skill File ↔ Pi Agent Role

## Charter

This document is the canonical mapping from framework skill files
(`skills/*.md`) to Pi agent roles (Plan / Work / Review). It exists
because `adr_p3_d5_pi_binding.org` was ACCEPTED as **Option A — Tight
binding** (per `f9afdd1`, 2026-04-21), and Option A's
§Consequences-Option-A obligation #3 requires a stable file-to-role
mapping that the framework treats as a contract, with its own changelog
discipline (`CHANGELOG.md`).

Pi's three agents invoke skill files directly per this map. Non-Pi
consumers (Claude Code, other LLM agents) follow the same map with
explicit user confirmation per `skills/orchestrator.md` and `CLAUDE.md`
§Mandatory Workflow step 8.

## Mapping

| Skill file                   | Pi agent role  | Activates when                                   |
|------------------------------|----------------|--------------------------------------------------|
| `skills/orchestrator.md`     | Plan agent     | Always; before complexity-score computation      |
| `skills/think.md`            | Work agent     | `complexity_tier ≥ STANDARD`                     |
| `skills/simplicity.md`       | Work agent     | `complexity_tier ≥ STANDARD`                     |
| `skills/surgical.md`         | Work agent     | Any task that modifies existing files            |
| `skills/goal.md`             | Work agent     | ALL tasks (minimal variant for TRIVIAL)          |
| `skills/review.md`           | Review agent   | `complexity_tier = STANDARD`                     |
| `skills/review-expert.md`    | Review agent   | `complexity_tier = COMPLEX` and umbrella tasks   |

Each skill file carries a four-line Pi-binding preamble (per
`plan_phase_5.org` §D2) restating its row of this table inline. The
preambles cite this file as the contract surface; this file cites
`adr_p3_d5_pi_binding.org` as the charter. Edits to the mapping must
land in this file first, then propagate to the per-skill preambles —
not the other way around.

## Change discipline

Renaming, removing, or splitting any skill file listed above is a
breaking change to Pi's agent behaviour. Every such change must:

1. Update this table.
2. Update the affected skill file's preamble.
3. Add a `### Changed` (or `### Removed` / `### Added`) entry to
   `CHANGELOG.md` under the current phase's section.

Drift between this file and the per-skill preambles is accepted-risk
per `plan_phase_5.org` §R2; if drift surfaces in practice, a Phase 6
lint can generalise on top of Wave B's `tools/review/lint-mirror.sh`
shape to enforce equality between table rows here and the inline
preamble blocks.

## References

- `adr_p3_d5_pi_binding.org` §Consequences-Option-A — charter for this
  document (obligation #3).
- `CLAUDE.md` §Skills + §Mandatory Workflow step 8 — top-level entry
  point that names Pi's Review agent and points downward at the skill
  files this map indexes.
- `skills/orchestrator.md` — source for the `complexity_tier`
  activation conditions in the third column.
- `CHANGELOG.md` — Pi contract surface; framework-file renames land
  here as breaking changes per the discipline above.
