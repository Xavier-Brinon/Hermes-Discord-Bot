# Plan Convention Template

Authoring guidance for `plan_phase_N.org` documents. Complements
`templates/session_journal.md` (session-level authoring) with
plan-level patterns. Read this before drafting a new phase plan.

Reference, not tutorial: each section below is a rule + source
incident + how-to-apply, not a walkthrough. Add sections when
concrete incidents motivate them, not speculatively.

---

## Codifying an authoring-time convention

When a plan introduces a new authoring-time convention — a new
artifact format, a new file-naming rule, a new commit-convention
element, a new reference style — order the plan's waves so the
codification ships **before** the first use.

If the convention must be used in the same wave that codifies it
(or earlier), explicitly note the pre-adoption exception in the
plan's `§Decisions` section. The exception should name the wave
that codifies, the waves that pre-adopt, and the rationale.

**Source incident:** `phase07_postmortem.org §L2` — the `<pending>`
SHA convention was introduced in Phase 7 Wave A's SESSION_LOG but
not codified in `CLAUDE.md §Commit convention` until Wave C. Waves
A / A.1 / B used `<pending>` as a dogfood precedent before the
convention was written down anywhere readable by a reviewer. The
outcome was clean (no retroactive patch needed), but the ordering
tension was not pre-acknowledged in the plan's `§Decisions`.

**How to apply:** when a plan introduces an authoring-time
convention, add a `§Decisions` entry naming:

1. The convention (short label).
2. The codification location (file + section).
3. The first-use wave.
4. If codification ships *before* first use: noted as pre-emptive.
5. If first-use ships *before* codification: noted as pre-adoption
   exception, with justification (usually "dogfood to verify the
   convention survives contact with reality before committing it
   to a governing doc").

---

## Risk register patterns

Plans include a `§Risks` section with rows `| id | risk | likelihood
| impact | mitigation |`. When authoring a new phase plan, seed the
risk register with canonical risk-class examples. New incidents
earn new canonical examples; do not invent risk classes without an
observed incident backing them.

### Canonical risk class: author-compliance on prior-phase schema policies

The risk that a new wave's own artifacts omit schema enforcement
that a prior phase shipped.

```
| =R<n>= | Author-compliance: new wave's own artifacts may omit
  schema enforcement a prior phase shipped | medium | medium |
  Apply the prior phase's schema policies during this wave's
  authoring; cross-check against `schemas/artifacts.md` before
  commit. The relevant pre-commit hook enforces at stage time
  (reject-before-commit is cheaper than review-catches-at-
  reviewer). |
```

**Source incident:** `phase07_postmortem.org §L1` — Phase 7 Wave
A's own `pre_computation_block.md` had 4 HIGH-confidence assumptions
without a `## Verifications` section, which `schemas/artifacts.md
§1` (shipped in Phase 6) requires for HIGH confidence. The miss
was corrected post-review. Phase 7 Wave A.1 shipped
`lint-precomputation.sh --since <sha>` with forward-scope
enforcement (grandfathering pre-anchor PCBs) so the class cannot
silently recur.

**How to apply:** any wave that produces artifacts governed by a
schema policy shipped in a prior phase should include this
risk-class row (or a variant specific to the wave's actual
schema-policy exposure) in its `§Risks` table. Cite the enforcing
pre-commit hook as the mitigation; if no hook enforces the policy,
escalate to a new hook in scope, or explain why a hook is not
justified.

---

## When to add a section to this template

Add a section here when:

- A concrete incident in a postmortem `§L` surfaces a recurring
  authoring-time pattern (convention ordering, risk-class
  coverage, wave-shape decision).
- Multiple phases have cited the same lesson (≥ 2 incidents).
- The incident is reachable by future plan authors via `§References`
  in their plan draft without first reading the full postmortem
  history.

Do not add a section for one-off incidents, speculative patterns,
or meta-guidance about the template itself. This file is a
reference for plan authors, not a meta-manual.
