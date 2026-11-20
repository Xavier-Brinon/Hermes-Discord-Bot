# Skill D: Goal-Driven Execution

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Work agent
> - Activates: ALL tasks (minimal variant for TRIVIAL)
> - Contract: `skills/pi-role-map.md`

## Purpose

Define and verify success criteria. Every subtask gets an explicit Pass/Fail
condition and a concrete test case before any code is written.

## Activation

Fires on **ALL** tasks. TRIVIAL tasks get the minimal variant (a single
Pass/Fail bullet). STANDARD+ tasks get the full table.

## Required context

- **Schema:** `schemas/artifacts.md` §4 (Verification Matrix)
- **Journal section referenced:** `templates/session_journal.md` —
  Post-Flight → Verification Results

## Instructions to the agent

1. **Decompose the task into subtasks.** Each subtask is a discrete unit
   of work with its own verification.
2. **Write a Pass criterion per subtask.** It must be objectively testable
   — "works correctly" is not a Pass criterion; "returns 0 for an empty
   array" is.
3. **Write a Test case per subtask.** Ideally a runnable test. At minimum,
   a check a human can perform in < 30 seconds.
4. **For TRIVIAL tasks,** use the minimal variant: one bullet restating the
   Pass criterion in imperative form.
5. **Write the artifact** to
   `.artifacts/{task_id}/verification_matrix.md`.
6. **After coding,** re-open the artifact and annotate each row with the
   observed outcome (PASS/FAIL + notes). Link the updated file from the
   Post-Flight Journal entry.

## Output format — full (STANDARD+)

```markdown
---
artifact_type: verification_matrix
task_id: {string}
timestamp: {ISO-8601}
complexity_score: {0-8}
complexity_tier: {STANDARD | COMPLEX}
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| ... | ... | ... |
```

## Output format — minimal (TRIVIAL)

```markdown
---
artifact_type: verification_matrix
task_id: {string}
timestamp: {ISO-8601}
complexity_score: {0-2}
complexity_tier: TRIVIAL
---

## Minimal variant (TRIVIAL only)
- Pass: {single measurable condition}
```

Full schema in `schemas/artifacts.md` §4.

## Failure modes to self-check

- **Any row where Pass criterion is vague** ("works", "is correct",
  "handles edge cases"). Rewrite with a measurable predicate.
- **Any row where Test case is "manual inspection"** on a non-UI task.
  Produce an automatable check or admit the verification is subjective.
- **Matrix row count equals 1 on a STANDARD+ task.** You under-decomposed
  — a STANDARD task almost always has ≥ 2 testable subtasks.
