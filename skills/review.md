# Reviewer Agent: Verification Gate

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Review agent
> - Activates: `complexity_tier = STANDARD`
> - Contract: `skills/pi-role-map.md`

## Purpose

Close the enforcement loop. Read a task's Session Journal entry *before*
the diff, run the mechanical Scope Adherence Check, and emit a schema-valid
Adherence Report. Instant-Fail any task where the Pre-Flight commitment
and the Post-Flight outcome disagree with the actual changes.

The Worker Agent writes the journal. The Reviewer Agent writes the
verdict.

## Activation

Fires when: a task has produced a Pre-Flight entry in `SESSION_LOG.md`
and at least one artifact under `.artifacts/{task_id}/`. Skip when no
journal entry exists (TRIVIAL-tier tasks write no journal; nothing to
review).

For COMPLEX-tier tasks, an Expert Reviewer is required (see Risk R3
in `plan_phase_2.org`). Phase 2 ships only the standard Reviewer; until
Phase 3 delivers the Expert Reviewer, COMPLEX tasks run with the
standard protocol plus explicit user confirmation per
`skills/orchestrator.md`.

## Required context

- **Schema:** `schemas/artifacts.md` §5 (Session Journal) and §6 (Adherence Report)
- **Enforcement rules:** `CLAUDE.md` §Enforcement (Instant Fail clauses)
- **Tool:** `tools/review/scope-adherence.sh` — mechanical Scope Adherence Check
- **Linter:** `tools/review/lint-frontmatter.sh` — trip-wire per ADR P2.D8
- **Gold Standard:** `examples/patterns/surgical-diff.md` — style-drift reference

## Instructions to the agent

1. **Run the trip-wire linters.** Before reading any artifact body, run
   two repo-structural checks in order:
   - (a) `tools/review/lint-frontmatter.sh .artifacts/{task_id}/` —
     Parser Contract trip-wire per ADR P2.D8. Non-zero exit → halt and
     emit an Adherence Report with `Reflex Rate: FAIL` and the violation
     detail from the linter's output. **Instant Fail** — the artifact
     schema's flat-scalar contract has been broken; successor ADR
     required before any further review.
   - (b) `tools/review/lint-shakedown.sh` — shakedown-completeness gate
     per `phase03_postmortem.org` §O4 (every `# Task:` entry in
     `SESSION_LOG.md` with Reflex Audit `PASSED` must have its sibling
     `.artifacts/<task_id>/adherence_report.md` on disk). Non-zero exit
     → log as warning in the Adherence Report and continue; not an
     Instant Fail per `plan_phase_3.org` Decision D4 (warnings until
     false-positive data supports promotion).
2. **Open `SESSION_LOG.md`.** Read the task's Pre-Flight entry first.
   Do NOT look at any diff yet. If no Pre-Flight section exists for
   this task_id, emit an Adherence Report with
   `Reflex Rate: FAIL` and stop — there is no contract to evaluate
   against.
3. **Extract the declared Pre-Flight commitments.** Specifically:
   - Simplicity Goal (the "I will use X, I will NOT use Y" sentence)
   - Scope Boundaries (In-scope + Out-of-scope lists)
   - Simplicity Strategy (`MINIMAL` / `STANDARD` / `DEEP`)
   - Cited Gold Standard (relative path under `examples/patterns/`)
4. **Open `.artifacts/{task_id}/` and read the four artifacts.**
   Verify every artifact's frontmatter `task_id` matches the journal
   entry's `task_id`. Mismatch = Instant Fail (journal/artifact drift).
5. **Run the Scope Adherence Check.** Invoke
   `tools/review/scope-adherence.sh {task_id}` (or `{task_id} --commit <sha>
   --emit` for a post-commit shakedown). Capture its stdout/stderr and
   exit code. The tool emits the mechanical fields of the Adherence
   Report; you fill the semantic fields below.
6. **Compare Post-Flight Reflex Audit against the actual diff.** Apply
   the three **Instant Fail** rules from `CLAUDE.md` §Enforcement
   verbatim:
   - **Journal mismatch.** Pre-Flight Simplicity Goal commits to *X*;
     Post-Flight Reflex Audit reports `PASSED`; the diff visibly
     violates *X* (e.g., imports a library the Goal excluded, adds a
     class the Goal forbade). Instant Fail.
   - **Line-Count Budget breach.** Actual non-blank, non-comment line
     count (logical LOC, per `schemas/artifacts.md` §2 "Line-Count
     Budget — counting method") exceeds the Simplicity Review's Target
     by more than 25% AND the `Simplify Triggers` section is empty or
     marked "None". Instant Fail. A budget overrun with a recorded
     Simplify Trigger is a violation but not an Instant Fail.
   - **Out-of-Bound violation.** The diff touches a file listed in
     `change_boundary.md` §Out-of-Bound List without a prior Change
     Boundary amendment. Instant Fail.

   Any Instant Fail → `Reflex Rate: FAIL` in the Adherence Report,
   non-zero exit code from `scope-adherence.sh`.
7. **Spot-check Style Drift.** Open the cited Gold Standard. Pick one
   representative function or block from the diff. Compare it against
   the Gold Standard's "After" example. If the diff violates the Gold
   Standard's principle verbatim (e.g., cited `surgical-diff.md` but
   bundled drive-by type annotations), log as Style Drift in the
   Violations table — not an Instant Fail by itself, but counted.
8. **Emit the Adherence Report.** Write
   `.artifacts/{task_id}/adherence_report.md` conforming to
   `schemas/artifacts.md` §6. All four sections required:
   `Skills fired`, `Artifacts produced`, `Violations`, `Metrics`.
   Set `Reflex Rate` per the rules above; fill `Scope Adherence`
   from `scope-adherence.sh`'s output.

## Output format

```markdown
---
artifact_type: adherence_report
task_id: {task_id}
timestamp: {ISO-8601}
complexity_score: {0-8}
complexity_tier: {TRIVIAL | STANDARD | COMPLEX}
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D

## Artifacts produced
- pre_computation_block: .artifacts/{task_id}/pre_computation_block.md
- simplicity_review: .artifacts/{task_id}/simplicity_review.md
- change_boundary: .artifacts/{task_id}/change_boundary.md
- verification_matrix: .artifacts/{task_id}/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     N | ...    |
| Scope Bleed      |     N | ...    |
| Style Drift      |     N | ...    |

## Metrics
- Reflex Rate: PASS | FAIL
- Scope Adherence: N% (file granularity per P2.D7)
```

Full schema in `schemas/artifacts.md` §6.

## Failure modes to self-check

- **Reviewer read the diff before the journal.** You cannot evaluate
  Pre-Flight commitments once you have seen the code; the assessment
  is contaminated. Instant Fail on the reviewer itself — redo from
  step 2, from a fresh state.
- **Adherence Report has placeholder semantic fields.** `Reflex Rate`
  left as `?` or `PASS | FAIL` template literal. The tool's stub is
  not the final report; you must fill in the model-driven fields.
- **Style Drift logged without citing a specific line.** "Diverges
  from surgical-diff.md" is not a finding; "imports `lodash` in a
  one-line bug fix, diverging from surgical-diff.md's 'change only
  what solves the problem' principle" is.
- **Running `scope-adherence.sh` before `lint-frontmatter.sh`.** The
  linter is the prelude. If the frontmatter contract is broken, no
  downstream parsing is trustworthy. Always lint first.
- **Instant Fail with vague detail.** Every Instant Fail must name
  the specific rule (Journal mismatch / Line-Count Budget breach /
  Out-of-Bound) and the specific file or line that triggered it.
