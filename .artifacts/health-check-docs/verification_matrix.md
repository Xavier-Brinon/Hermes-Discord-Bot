---
artifact_type: verification_matrix
task_id: health-check-docs
timestamp: 2026-09-25T12:12:28Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 0 (README.md) + Ambiguity 0 (issue lists the ACs) + Risk 0 (docs) + Knowledge Gap 1 (VPS facts gathered this session) = **1 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Launcher-faithful command | reads HERMES_BIN + HERMES_PROFILE from the encrypted .env, no hand-typed values | stub run: `HERMES_BIN=echo HERMES_PROFILE=discord-bot-021 sh -c …` → `-p discord-bot-021 chat -q Dis bonjour. -Q --source tool` | PASS |
| Presence ≠ answering | README says online ≠ answering; @mention is definitive | README §Health check | PASS |
| Two-install hazard + which binary | both paths named; 🔌 startup line + filtered `pm2 env` | README; 🔌 line verified live 2026-09-25 (9afaeac) | PASS |
| Docs-only | no code change | git diff --stat | PASS |
| Format | prettier clean | npx prettier --check . | PASS |
| Issue lifecycle | comment before solve | rad issue show c8e3c35 | PENDING — merge |
