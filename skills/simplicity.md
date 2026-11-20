# Skill B: Simplicity First

> **Pi binding** (per `adr_p3_d5_pi_binding.org` Option A)
> - Invoked by: Work agent
> - Activates: `complexity_tier ≥ STANDARD`
> - Contract: `skills/pi-role-map.md`

## Purpose

Actively detect and kill over-engineering. Force the agent to state what it
deliberately did NOT add.

## Activation

Fires when: `complexity_tier ∈ {STANDARD, COMPLEX}` (equivalently, raw score
≥ 3). Skip on TRIVIAL.

## Required context

- **Schema:** `schemas/artifacts.md` §2 (Simplicity Review)
- **Gold Standards:**
  - `examples/patterns/simple-loop.md` — obvious form over clever chain
  - `examples/patterns/surgical-diff.md` — minimal change over "while I'm here"
- **Anti-Patterns to contrast against:**
  - `examples/anti-patterns/bloated-loop.md` — defensive loops, ghost flags
  - `examples/anti-patterns/god-object.md` — accretion disguised as API design

## Instructions to the agent

1. **State the Simplest Possible Solution in one paragraph.** No hedging. If
   you cannot describe it plainly, it is not simple yet.
2. **Build an Abstinence List.** Enumerate every abstraction, flag, config
   knob, or generalisation you were tempted to add and chose not to.
   Minimum 2 entries. "Nothing to abstain from" is almost always wrong —
   look harder.
3. **Set a Line-Count Budget up front.** Estimate Target before coding.
   Record Actual after — both counted as **logical LOC** (non-blank,
   non-comment lines), per `schemas/artifacts.md` §2 "Line-Count Budget —
   counting method". Delta > +25% of Target is a Simplify Trigger.
4. **Contrast against at least one Anti-Pattern** from `examples/anti-patterns/`
   by relative path. Name which failure mode you are specifically avoiding.
5. **List any detected Simplify Triggers.** If none, state "None" — don't
   omit the section.
6. **Write the artifact** to
   `.artifacts/{task_id}/simplicity_review.md`.

## Output format

```markdown
---
artifact_type: simplicity_review
task_id: {string}
timestamp: {ISO-8601}
complexity_score: {0-8}
complexity_tier: {STANDARD | COMPLEX}
---

## Simplest Possible Solution
{one paragraph}

## Abstinence List (not added, intentional)
- {thing not added} — {reason}

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      N |      M |  ±X   |

## Simplify Triggers (detected)
- None | {trigger description}
```

Full schema in `schemas/artifacts.md` §2.

## Failure modes to self-check

- **Abstinence List is empty.** You did not entertain the over-engineered
  version, so you cannot claim to have chosen against it.
- **Delta > +25%.** Stop. Either re-plan with a higher Target (and justify
  why in Simplify Triggers) or find what to cut.
- **"Flexible" or "extensible" appears in the Simplest Possible Solution
  paragraph.** Flexibility is almost always YAGNI in its first commit.
