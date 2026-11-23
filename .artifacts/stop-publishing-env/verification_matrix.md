---
artifact_type: verification_matrix
task_id: stop-publishing-env
timestamp: 2026-11-18T22:50:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Complexity Score
Scope 1 (3 tracked files) + Ambiguity 1 (runbook home open) + Risk 1 (a careless VPS pull deletes the live `.env`) + Knowledge Gap 0 = **3 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 .env untracked and ignored | `git ls-files .env` empty after commit; `git check-ignore .env` matches; local file kept | git ls-files / check-ignore / ls -l .env | PASS (index deletion staged, `.gitignore:3`, file on disk) |
| AC2 README has no §Secrets | no `§Secrets` or private key path in README | `rg` check on README.md | PASS (no match) |
| AC3 runbook kept privately | Org copy in a gitignored path, org-review clean | `git check-ignore private/secrets-runbook.org`; org-review lint | PASS (location: `private/secrets-runbook.org` on the Mac; final home still the user's call) |
| AC4 VPS pulled, .env intact | env (7) (one key dropped in the 2026-11-18 rotation), PM2 online, @mention answers | private runbook procedure | PASS 2026-11-19: untracked + ignored, 600, env (7), PM2 ↺0, @mention answered |
| No regression | tests, lint | node --test test/*.test.js; npx prettier --check README.md | PASS: 173/173 |
| Issue lifecycle | comment before solve | rad issue show 2d31981 | PENDING: merge |
