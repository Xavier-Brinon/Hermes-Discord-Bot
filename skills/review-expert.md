# Expert Reviewer Agent: Verification Gate for COMPLEX Tasks

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Review agent
> - Activates: `complexity_tier = COMPLEX` and umbrella tasks
> - Contract: `skills/pi-role-map.md`

## Purpose

Extend the standard Reviewer Agent protocol (`skills/review.md`) for
tasks that (a) score COMPLEX (rubric sum 6–8) or (b) are umbrellas
composed of multiple STANDARD sub-tasks per Phase 2's compositional
pattern (see `phase02_postmortem.org` Learning L3).

The standard Reviewer reads ONE task in isolation. The Expert Reviewer
reads the same task PLUS the prior session history and the diff's
dependency shape, surfacing three finding classes the standard
Reviewer cannot emit by construction:

- **Cross-task contradiction.** This task's Simplicity Goal or Scope
  Boundary conflicts with a prior task's commitment on the same code
  region, or a Line-Count Budget has drifted upward across tasks.
- **Umbrella boundary breach.** When multiple sub-task Change
  Boundaries compose into an implicit umbrella, some sub-task
  touched a file the umbrella would have disallowed, or sub-tasks
  overlap on a file without a Creation Order note.
- **Architectural drift.** The diff changed the dependency graph's
  shape (new cross-module import, silent public-API consumer)
  beyond what the Change Boundary's Orthogonal Issues flagged.

All three findings emit as **warnings, never Instant Fails** — per
`plan_phase_3.org` Decision D4. The three inherited Instant Fail
rules from `CLAUDE.md` §Enforcement (Journal mismatch, Line-Count
Budget breach, Out-of-Bound violation) remain unchanged.

## Activation

Fires when BOTH of the following hold:

- The task being reviewed has produced a Pre-Flight entry in
  `SESSION_LOG.md` AND at least one artifact under
  `.artifacts/{task_id}/`.
- EITHER the task's `complexity_tier` is `COMPLEX`, OR the task's
  SESSION_LOG entry references ≥ 2 sub-task Change Boundaries
  (the umbrella pattern identified in `phase02_postmortem.org` L3).

Skip when either (a) no journal entry exists (TRIVIAL-tier writes
none) or (b) the task is STANDARD with no umbrella composition —
route to the standard Reviewer at `skills/review.md` instead.

## Required context

- **Standard Reviewer protocol:** `skills/review.md` — the 8
  instruction steps are inherited verbatim; this file extends them
  with 3 more.
- **Schema:** `schemas/artifacts.md` §5 (Session Journal) and §6
  (Adherence Report).
- **Enforcement rules:** `CLAUDE.md` §Enforcement — three Instant
  Fail clauses inherited unchanged.
- **Full session history:** `SESSION_LOG.md` — ALL prior `# Task:`
  sections, not only the current one.
- **Tool:** `tools/review/scope-adherence.sh` (step 6).
- **Linter:** `tools/review/lint-frontmatter.sh` (step 1; trip-wire
  per ADR P2.D8).
- **Gold Standard:** `examples/patterns/surgical-diff.md` — the
  style-drift reference.
- **Governing decisions:** `plan_phase_3.org` Decision D4 (warnings
  never Instant Fails), Decision D7 (three differentiating axes),
  Decision D8 (Phase 3 self-application on its own umbrella).

## Instructions to the agent

Steps 1–8 are inherited verbatim from `skills/review.md` — run them
first, in order. Steps 9–11 are the Expert Reviewer extensions per
Decision D7.

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

---

**(Expert Reviewer extensions — Decision D7)**

9. **Cross-task history scan.** Open `SESSION_LOG.md` and read every
   prior `# Task:` section, not only the current one. For each:
   - Extract the declared Scope Boundaries (In-scope + Out-of-scope).
     If any file in this task's File Touch List appears in a prior
     task's Out-of-scope list AND the prior task is still the
     authoritative owner of that file's concerns (no intervening
     ownership transfer in a later task's journal), log
     `cross_task_contradiction` naming the file and the prior task.
   - Track the Line-Count Budget Target declared in each task's
     `simplicity_review.md`. If Target has grown > 20% per task
     across the last three tasks on the same code region with no
     architectural reason recorded in the Simplify Triggers, log
     `cross_task_contradiction` citing budget inflation.
   - Not an Instant Fail. The warning lets the Worker Agent
     contest via a Post-Flight amendment or a dedicated successor
     Change Boundary.
10. **Multi-session umbrella reconciliation.** If the task under
    review is an umbrella — its SESSION_LOG entry references ≥ 2
    sub-task Change Boundaries — construct the implicit umbrella
    boundary as the union of the sub-task File Touch Lists. Then:
    - For each sub-task, check whether any file it touched would
      have been in the umbrella's Out-of-Bound list had the
      umbrella been authored as a single Change Boundary. If yes,
      log `umbrella_boundary_breach` naming the sub-task and the
      file.
    - Check for sub-tasks whose File Touch Lists overlap on the
      same file. Overlap is legitimate (sequenced edits) but must
      be reflected in the Creation Order block of at least one
      sub-task. If an overlap has no Creation Order coordination,
      log `umbrella_boundary_breach` for coordination failure.
    - If the current task is NOT an umbrella, skip step 10 silently
      and emit zero `umbrella_boundary_breach` warnings.
11. **Architectural drift detection.** Inspect the diff's
    dependency-graph delta:
    - Cross-module import / source added without a flag in the
      Change Boundary's Orthogonal Issues → log
      `architectural_drift_warning` naming the module pair.
    - File previously only imported internally that now has a
      public-API consumer (exported symbol newly imported from
      outside its module) → log `architectural_drift_warning`
      naming the export boundary crossing.
    - Dependency-shape inspection is necessarily language-specific.
      For the Phase 2/3 stack (shell + Python3 + Markdown), grep
      the diff for `source`, `. "…"` (dot-sourcing), `python3
      …/lib/*.py` invocations, `import X` / `from X import`, and
      relative `[text](path)` Markdown references. Compare against
      the prior commit's set. Document the exact grep commands
      run in the Adherence Report's `<!-- Reviewer notes -->`
      block so a future Reviewer can audit.
    - Phase 4 extends the grep set when Pi-binding-relevant
      languages land (per `adr_p3_d5_pi_binding.org`).

## Output format

Same as `skills/review.md` §Output format (Adherence Report per
`schemas/artifacts.md` §6), with the Violations table extended to
include three new rows when the Expert Reviewer fires:

```markdown
## Violations
| Type                         | Count | Detail |
|------------------------------|-------|--------|
| Complexity Creep             |     N | ... (inherited) |
| Scope Bleed                  |     N | ... (inherited) |
| Style Drift                  |     N | ... (inherited) |
| cross_task_contradiction     |     N | ... (Expert Reviewer; warning) |
| umbrella_boundary_breach     |     N | ... (Expert Reviewer; warning) |
| architectural_drift_warning  |     N | ... (Expert Reviewer; warning) |
```

`Reflex Rate` stays `PASS | FAIL`. None of the three new rows
promotes to Instant Fail in Phase 3. If the only findings are from
the new rows (inherited counts all zero), emit `Reflex Rate: PASS`
with the warnings visible; the consumer (downstream Reviewer, user,
Phase 4 metrics aggregator) decides whether to escalate.

Warning cap per axis: if any axis exceeds 5 warnings, truncate to
the 5 highest-severity and append an overflow footer inside the
Adherence Report's `<!-- Reviewer notes -->` block:

```html
<!-- 12 additional cross_task_contradiction warnings — see git log -->
```

The `expert_reviewer_depth` optional Change Boundary field
contemplated in `plan_phase_3.org` §Risk R5 is **not implemented in
Phase 3**; a per-task depth cap is a Phase 4 enhancement contingent
on real-run false-positive data.

## Failure modes to self-check

Inherited from `skills/review.md` §Failure modes (apply to steps
1–8):
- **Reviewer read the diff before the journal.** Redo from step 2,
  from a fresh state.
- **Adherence Report has placeholder semantic fields.** Fill
  `Reflex Rate` / `Complexity Creep` / `Style Drift` counts; the
  tool stub is not the final report.
- **Running `scope-adherence.sh` before `lint-frontmatter.sh`.** Lint
  is the prelude; always run it first.

Added for the Expert Reviewer (apply to steps 9–11):
- **I only read the current task's journal entry.** Step 9
  requires scanning every prior `# Task:` section in
  `SESSION_LOG.md`. If my `cross_task_contradiction` count is zero
  AND prior tasks touched files in the current task's Touch List,
  I did not actually scan — redo step 9.
- **I did not reconcile umbrella sub-task boundaries.** Step 10
  requires explicitly computing the union of sub-task File Touch
  Lists when the task is an umbrella. Zero `umbrella_boundary_breach`
  warnings on a multi-sub-task umbrella is suspect; non-zero is the
  common case after real reconciliation.
- **I did not inspect the task's dependency-graph changes.** Step
  11 requires grepping the diff for cross-module imports /
  sourcing / relative references. Emitting zero
  `architectural_drift_warning` without recording the grep
  commands in the Adherence Report's `<!-- Reviewer notes -->`
  block is evidence I skipped step 11. Document the commands;
  a future Reviewer audits.
