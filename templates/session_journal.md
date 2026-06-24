# Session Journal Template

`SESSION_LOG.md` is an **append-only transcript**. Every new task goes at the
bottom. Never overwrite, never replace, never truncate — only add. If the file
does not exist yet, copy this template to create it. If it already exists, add
a new `# Task:` section at the end. Each task gets one Pre-Flight entry (before
coding) and one Post-Flight entry (after coding).

Schema reference: `schemas/artifacts.md` §5 (Session Journal).

---

# Task: {task_id}
complexity_score: {0-8}
complexity_tier: {TRIVIAL | STANDARD | COMPLEX}

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will use {simple technique}. I will NOT use {over-engineered approach I could be tempted by}.
- **Scope Boundaries:**
  - In-scope: {files / areas that MAY change}
  - Out-of-scope: {files explicitly forbidden to touch}

### Simplicity Strategy
`MINIMAL | STANDARD | DEEP`

Choose MINIMAL by default. Only escalate when the task's verification criteria
demand more surface area.

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/{file}.md`
- Anti-Pattern avoided: `examples/anti-patterns/{file}.md`

### Assumptions
`.artifacts/{task_id}/pre_computation_block.md`

*(Link to the Pre-Computation Block artifact produced by Skill A.)*

---

## Post-Flight Entry

### Reflex Audit
`PASSED | FAILED`

Rationale: *{one paragraph — did the final code honour the Pre-Flight Simplicity Goal? If FAILED, what slipped?}*

### Violation Checklist
- [ ] **Complexity Creep** — added unused flags, hidden branches, or abstractions beyond the Pre-Flight commitment?
- [ ] **Scope Bleed** — touched files in the Out-of-scope list?
- [ ] **Style Drift** — diverged from the structure of the cited Gold Standard?
- [ ] **Issue Lifecycle** — Radicle issue comment posted before state transition, documenting patch ID, merge SHA, and verification outcomes?

### Verification Results
`.artifacts/{task_id}/verification_matrix.md`

*(Link to the Verification Matrix artifact produced by Skill D, with each row's
pass/fail outcome filled in post-hoc. Rows attesting post-commit SHA fields
— e.g., "single atomic commit" — carry the literal `<pending>` marker at
commit time, backfilled at the phase postmortem commit per `CLAUDE.md`
§Commit convention `### SHA references in self-attested artifacts`.)*

---

## Usage Notes

1. The Pre-Flight entry is a **gate** — no file modifications until it is
   recorded in the log.
2. The Reviewer reads this file **before** the diff. Mismatches between
   Pre-Flight commitments and Post-Flight outcomes are Instant Fails.
3. Keep entries terse but specific. "Simple technique" is not a Simplicity
   Goal; "a single for-loop helper, no class" is.
4. TRIVIAL-tier tasks do NOT need a Session Journal — they only produce a
   minimal Verification Matrix.
