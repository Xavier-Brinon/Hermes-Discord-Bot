---
artifact_type: verification_matrix
task_id: veille-adr
timestamp: 2026-10-15T12:00:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (two new docs) + Ambiguity 0 (decisions taken with the user) + Risk 0 (docs) + Knowledge Gap 1 (sources researched this session) = **2 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| ADR 0002 records the user's decisions | same bot, v1 sources, 9h single post, quiet-day + Wednesday joke, lois kept | read docs/adr/0002-…org against the conversation | PASS |
| Research note cites primary sources | every claim sourced or in the Unverified list | read docs/research/french-gov-activity-sources.org | PASS |
| Org, not Markdown | both files .org, org-lint clean | org-review-lint on both files: no output | PASS |
| ADR links the epic | `#+issue: b982ce8` | grep | PASS |
| Docs-only | no code change | git diff --stat | PASS |
| Issue lifecycle | epic stays open (v1 not built) | rad issue show b982ce8 | N/A — epic closes with v1 |
