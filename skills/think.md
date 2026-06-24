# Skill A: Think Before Coding

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Work agent
> - Activates: `complexity_tier ≥ STANDARD`
> - Contract: `skills/pi-role-map.md`

## Purpose

Force explicit reasoning, assumption validation, and scope declaration
*before* any file is touched.

## Activation

Fires when: `complexity_tier ∈ {STANDARD, COMPLEX}`. Skip on TRIVIAL.

## Required context

- **Schema:** `schemas/artifacts.md` §1 (Pre-Computation Block)
- **Journal template:** `templates/session_journal.md` — Pre-Flight section
- **Gold Standards to anchor scope discipline:**
  - `examples/patterns/surgical-diff.md` (what staying in scope looks like)
  - `examples/patterns/simple-loop.md` (bias toward the obvious form)

## Instructions to the agent

1. **Read the schema.** Your output must conform to the Pre-Computation Block
   structure in `schemas/artifacts.md` §1.
2. **List every assumption.** Each gets a Confidence score: HIGH / MEDIUM /
   LOW. A LOW-confidence assumption is a red flag — ask before proceeding.
3. **Declare scope explicitly.** Name files you WILL touch and files you will
   NOT. Err on the side of over-enumerating the off-limits list.
4. **Record at least one interpretation** of the request, even if the wording
   feels unambiguous. This forces you to consider alternate readings.
5. **List at least one alternative you considered and rejected** — with the
   reason. If you cannot name one, you did not think hard enough about the
   design space.
6. **Cite a Gold Standard by relative path** before writing any code.
7. **Write the artifact** to
   `.artifacts/{task_id}/pre_computation_block.md`.
8. **Append a link** to the artifact in the Pre-Flight entry of
   `SESSION_LOG.md`.

## Output format

Produce a Markdown file with the following structure (full schema in
`schemas/artifacts.md` §1):

```markdown
---
artifact_type: pre_computation_block
task_id: {string}
timestamp: {ISO-8601}
complexity_score: {0-8}
complexity_tier: {STANDARD | COMPLEX}
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|

## Scope Declaration
### Files in scope
- path — rationale

### Files off-limits
- path — reason

## Interpretations of the request
- ...

## Alternatives considered
- ... — rejected: ...
```

## Failure modes to self-check

- **No rejected alternatives listed.** You skipped the design-space step.
  Go back.
- **Zero LOW-confidence assumptions AND the task is non-trivial.** You are
  either overconfident or underspecifying.
- **Off-limits list is empty.** Every non-trivial change has tempting
  nearby files. Name them.
