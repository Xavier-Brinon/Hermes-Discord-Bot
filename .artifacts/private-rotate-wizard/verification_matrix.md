---
artifact_type: verification_matrix
task_id: private-rotate-wizard
timestamp: 2026-11-19T21:55:00Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (move + .gitignore + one record row) + Ambiguity 0 + Risk 0 (no runtime code) + Knowledge Gap 0 = **1 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Wizard off the public tree | ops/rotate-secrets.sh untracked; private copy byte-identical and ignored | `cmp`, `git check-ignore` | PASS |
| No dangling reference | no rotate-secrets mention outside records | rg | PASS (none) |
| VPS-local files ignored | bin/ and __pycache__/ ignored | `git check-ignore` | PASS |
| stop-publishing-env AC4 backfilled | env (7) and the 2026-11-19 result | read | PASS |
