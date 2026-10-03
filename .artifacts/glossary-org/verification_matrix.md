---
artifact_type: verification_matrix
task_id: glossary-org
timestamp: 2026-10-03T14:30:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (glossary + 2 references) + Ambiguity 0 (issue lists the ACs) + Risk 0 (docs only) + Knowledge Gap 1 (the glossary was a table; reshaped to description lists) = **2 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Glossary moved | `CONTEXT.md` → `GLOSSARY.org` via `git mv` (history follows) | git status | PASS |
| Every term kept | each `\| Term \| Meaning \|` row becomes a `- Term :: meaning` item | count rows vs items | PASS: 12 of 12 |
| Org style | org-lint clean on GLOSSARY.org and on every changed line | org-review-lint.el | PASS |
| No live CONTEXT.md reference | grep outside history (SESSION_LOG, .artifacts) and the vendored framework copy (templates/, mirrors Pi-YackShaving) | `grep -rl 'CONTEXT\.md'` | PASS |
| Docs-only | no code change | git diff --stat | PASS |
| Issue lifecycle | comment before solve | `rad issue show 4ac314e` | PENDING: merge |
