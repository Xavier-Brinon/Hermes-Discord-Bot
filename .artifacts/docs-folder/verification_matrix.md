---
artifact_type: verification_matrix
task_id: docs-folder
timestamp: 2026-11-19T07:57:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (file moves + 2 edits) + Ambiguity 0 (user confirmed the table) + Risk 0 (docs only) + Knowledge Gap 1 (where GitHub reads SECURITY.md) = **2 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Only tool-required docs at root | README.md, AGENTS.md, CLAUDE.md, SESSION_LOG.md, METRICS.md | `ls -1 \| grep -E '\.(md\|org)$'` | PASS |
| No broken reference | no bare GLOSSARY.org / waysofworking.org / hermes-discord-bot.md / SECURITY.md outside docs/ and records | rg | PASS (none) |
| Design doc converted | docs/hermes-discord-bot.org, org-review clean | org-review lint | PASS |
| Private runbook moved, still ignored | `git check-ignore docs/private/secrets-runbook.org` | check-ignore | PASS (.gitignore:29) |
| Emacs backups gone and ignored | no `*~`; `*~` in .gitignore | find | PASS |
| GitHub still shows the security policy | `isSecurityPolicyEnabled` true after push | gh repo view | PENDING: push |
