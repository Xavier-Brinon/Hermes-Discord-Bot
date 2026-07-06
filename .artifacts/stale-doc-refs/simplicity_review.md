---
artifact_type: simplicity_review
task_id: stale-doc-refs
timestamp: 2026-07-06T19:54:23Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Correct exactly the false claims, in place. Rewrite CONTEXT.md's "Link summary" entry
(📝-reaction opt-in on any link, no denylist) and rename "Banner parsing" → "Output parsing
(`-Q`)"; fix CLAUDE.md's summary line, CLI-wrapper bullet (`-Q` + `parseHermesOutput`), and the
three-flows line (📝-reaction). No code change — the code is already correct; only the prose lied.

## Abstinence List (not added, intentional)
- No code change — the docs were wrong, not the code.
- No new doc sections / restructuring — corrected the existing glossary rows and bullets in place.
- No whole-file prettier reformat of CONTEXT.md — pre-existing dirt left as orthogonal.
- No sweep-and-rewrite of unrelated glossary entries — only the four verified-stale claims touched.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      0 |      0 |     0 |

## Simplify Triggers (detected)
- None. Zero logical code LOC (docs-only, 7 insertions / 7 deletions across 2 markdown files). Mirrors `examples/patterns/surgical-diff.md`: each edit corrects exactly one false statement; the rest of both files is untouched.
