# Skill C: Surgical Changes

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Work agent
> - Activates: any task that modifies existing files
> - Contract: `skills/pi-role-map.md`

## Purpose

Govern code scope. Declare, in writing, which files change and why — and
which files will NOT change. Catch scope bleed before it becomes a
too-big-to-review PR.

## Activation

Fires when: any task modifies existing files (required for STANDARD+;
recommended for TRIVIAL modifications).

## Required context

- **Schema:** `schemas/artifacts.md` §3 (Change Boundary)
- **Journal section referenced:** `templates/session_journal.md` —
  Pre-Flight → Scope Boundaries
- **Gold Standard (primary):** `examples/patterns/surgical-diff.md`
- **Anti-Pattern to avoid:** `examples/anti-patterns/god-object.md`

## Instructions to the agent

1. **Build the File Touch List.** For every file you plan to modify, record
   `Path`, `Why` (one sentence of rationale), and `Expected change type`
   (modify / create / delete).
2. **Build the Out-of-Bound List.** For every file that would be tempting
   to "quickly improve" in this task, name it and give a reason it is
   deferred. Examples: different concern, different PR, different owner.
3. **Record Creation Order if ordering matters.** If any file in the
   Touch List cannot be created until a prior action succeeds — e.g.
   `git init` must run before `git commit`, or `rad init` requires an
   initial commit — write the steps in execution order under
   `Creation Order`. Omit the section entirely when files can be created
   in any order.
4. **Record Orthogonal Issues.** Every real change reveals unrelated
   weaknesses nearby — a naming inconsistency, a missing test, a comment
   rot. Capture them here with "why not now" instead of fixing them.
5. **Track Orphans.** After the change, list any imports, variables, or
   exports that become unused as a side-effect. For each, decide: remove
   this commit, keep for now, defer.
6. **Cite** `examples/patterns/surgical-diff.md` as the discipline model,
   and name `examples/anti-patterns/god-object.md` as the failure mode you
   are explicitly avoiding.
7. **Write the artifact** to
   `.artifacts/{task_id}/change_boundary.md`.

## Output format

```markdown
---
artifact_type: change_boundary
task_id: {string}
timestamp: {ISO-8601}
complexity_score: {0-8}
complexity_tier: {STANDARD | COMPLEX | TRIVIAL}
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|

## Out-of-Bound List
- path — reason

## Creation Order (if ordering matters)
1. {action or file} — {prerequisite}

## Orthogonal Issues (noticed, skipped)
- {issue} — {why not now}

## Orphan Tracking
- {unused after change} — {remove | keep | defer}
```

Full schema in `schemas/artifacts.md` §3.

## Orphan detection — manual recipe (Phase 1)

Automation for Orphan Tracking is deferred to Phase 3. For Phase 1, run
the language-appropriate check manually and paste findings into the
Orphan Tracking section:

- **TypeScript / JavaScript:** `tsc --noUnusedLocals --noUnusedParameters`
  or `eslint --rule 'no-unused-vars: error'`.
- **Python:** `ruff check --select F401,F841`.
- **Rust / Go:** compiler warnings on an unused-variables build.

## Failure modes to self-check

- **Out-of-Bound List is empty.** There is always a tempting adjacent file.
  You skipped the discipline step.
- **Orthogonal Issues is empty.** Look again. If the codebase is really
  pristine, state "None observed" explicitly — don't omit the section.
- **File Touch List includes a file not referenced in the Pre-Flight
  Scope Boundaries.** That is a live Scope Bleed violation — reconcile
  before coding.
