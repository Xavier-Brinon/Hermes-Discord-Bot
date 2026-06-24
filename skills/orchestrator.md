# Complexity Orchestrator

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Plan agent
> - Activates: always, before complexity-score computation
> - Contract: `skills/pi-role-map.md`

## Purpose

Deterministic decision rule that runs during the Plan phase of every task.
Computes a **Complexity Score** (raw sum, 0–8) from four dimensions and
maps the sum to a **Tier** that selects which Skills fire.

This is not a model call — it is a rubric the agent evaluates
mechanically.

## Scoring Rubric (canonical)

| Dimension       | 0 (Low)                         | 1 (Medium)                   | 2 (High)                             |
|-----------------|---------------------------------|------------------------------|--------------------------------------|
| Scope Size      | 1 file                          | 2–3 files                    | > 3 files                            |
| Ambiguity       | Clear, step-by-step             | Some context needed          | Unclear requirements                 |
| Risk Surface    | Internal / helper functions     | Public API / shared logic    | Critical path / user-facing          |
| Knowledge Gap   | None (agent knows the code)     | Partial (must read)          | Unknown (must explore)               |

**Score** = sum of the four dimension values. Range: 0–8.

*(PRD v3 §4.1 labels the score "1–10" informally; the authoritative range
is 0–8 — see Decision D2 (score is 0-8) in `plan_phase_1.org`.)*

## Tier Mapping

| Raw sum | Tier     | Active skills                                  | Additional requirements                                                     |
|---------|----------|------------------------------------------------|-----------------------------------------------------------------------------|
| 0 – 2   | TRIVIAL  | D only                                         | Minimal Verification Matrix. No Session Journal required.                   |
| 3 – 5   | STANDARD | A + B + C + D                                  | Full Session Journal. Gold Standard reference required.                     |
| 6 – 8   | COMPLEX  | A + B + C + D + Expert Reviewer                | Session Journal + Reviewer Agent assigned + explicit user confirmation.     |

## Worked Examples

### Example 1 — TRIVIAL

**Task:** "Rename variable `foo` to `bar` in `utils.ts`."

| Dimension     | Value | Score |
|---------------|-------|-------|
| Scope Size    | 1 file | 0 |
| Ambiguity     | Step-by-step | 0 |
| Risk Surface  | Internal helper | 0 |
| Knowledge Gap | None | 0 |
| **Sum**       |       | **0** |

**Tier:** TRIVIAL → activate Skill D (minimal).
**Minimal Verification Matrix:** `variable renamed; project tests still pass`.

### Example 2 — STANDARD

**Task:** "Add a retry with exponential backoff to `apiClient.fetch`."

| Dimension     | Value | Score |
|---------------|-------|-------|
| Scope Size    | 1 file modified, 1 new file (still within "2–3 files") | 1 |
| Ambiguity     | Some context needed (backoff params unspecified) | 1 |
| Risk Surface  | Public API | 1 |
| Knowledge Gap | Partial (must read `apiClient`) | 1 |
| **Sum**       |       | **4** |

**Tier:** STANDARD → activate A + B + C + D + Session Journal.
**Required gold-standard reference:** `examples/patterns/surgical-diff.md`.

### Example 3 — COMPLEX

**Task:** "Replace auth middleware across the request pipeline."

| Dimension     | Value | Score |
|---------------|-------|-------|
| Scope Size    | > 3 files | 2 |
| Ambiguity     | Legacy behaviour unclear | 2 |
| Risk Surface  | Critical path / user-facing | 2 |
| Knowledge Gap | Must explore | 2 |
| **Sum**       |       | **8** |

**Tier:** COMPLEX → activate all 4 skills + Expert Reviewer + explicit
user confirmation before coding begins.

## Scoring Workflow

1. Read the user's request.
2. Evaluate each dimension against the rubric. Pick a value (0 / 1 / 2)
   for each.
3. Sum the four values.
4. Look up the tier.
5. Activate the listed Skills in order: A → B → C → D.
6. (COMPLEX only) Stop and obtain explicit user confirmation before
   proceeding to the Work phase.

## Ambiguity Resolution

- **Borderline between 2 and 3 files** → round up to 1 (2 files with light
  coupling) or 2 (true multi-file refactor).
- **Borderline between tiers** (e.g. score 5 vs 6) → round DOWN. The framework
  is a counterweight to over-engineering; bias toward fewer gates, not more.
- **Ambiguity self-check:** if you cannot pick a score within 30 seconds for
  any dimension, score it +1 — that hesitation itself is evidence of
  ambiguity.

## Reference

- Full background and decision history: `plan_phase_1.org` §Decisions D1 (3 tiers, not 4), D2 (score is 0-8)
- Terminology: `UBIQUITOUS_LANGUAGE.md` §3
