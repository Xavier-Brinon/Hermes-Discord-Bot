---
artifact_type: verification_matrix
task_id: soul-persona-dependency
timestamp: 2026-09-25T08:51:39Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 0 (CONTEXT.md) + Ambiguity 0 (decision made by user) + Risk 0 (docs) + Knowledge Gap 1 (SOUL.md content read on the VPS) = **1 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Decision recorded | 8f33078 comment: keep persona, no --ignore-rules, stale format rule removed | rad issue show 8f33078 | PASS |
| Dependency explicit | CONTEXT.md "Persona (SOUL.md)" entry | grep CONTEXT.md | PASS |
| Evidence | fresh-session A/B with and without --ignore-rules: neither 📌/❓; SOUL.md held the rule | VPS run 2026-09-25 | PASS |
| SOUL.md edited | `grep -c '📌' SOUL.md` = 0 in discord-bot-021, backup SOUL.md.bak-2026-09-25 | VPS | PASS |
| Live: Q&A in a summary thread | plain paragraphs, no 📌/❓ | Discord | PENDING — live |
| Format | prettier clean | npx prettier --check . | PASS |
