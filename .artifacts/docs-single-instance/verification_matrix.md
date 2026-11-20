---
artifact_type: verification_matrix
task_id: docs-single-instance
timestamp: 2026-10-05T09:54:37Z
complexity_score: 0
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 0 (AGENTS.md + README.md) + Ambiguity 0 (issue lists the ACs) + Risk 0 (docs) + Knowledge Gap 0 (README already documents the retired watchdog) = **0 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Stale watchdog line | AGENTS.md (CLAUDE.md symlink) harness paragraph matches README: PM2 + gateway hook + dotenvx, no watchdog | grep -n watchdog AGENTS.md | PASS |
| Single-instance warning | README §Watch points says exactly one process, and why | README §Watch points | PASS |
| Docs-only | no code change | git diff --stat | PASS |
| Format | prettier clean | npx prettier --check . | PASS |
| Issue lifecycle | comment before solve | rad issue show 6c1ce46 | PENDING — merge |
