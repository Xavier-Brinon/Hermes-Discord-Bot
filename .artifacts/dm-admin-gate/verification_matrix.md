---
artifact_type: verification_matrix
task_id: dm-admin-gate
timestamp: 2026-11-18T14:30:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Complexity Score
Scope 2 (6 files) + Ambiguity 1 (DM policy and toolset choice left open by the issue) + Risk 2 (critical message path, security) + Knowledge Gap 1 (Hermes toolset resolution read in its source) = **6 → COMPLEX**. User confirmed the plan 2026-11-18.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 non-admin DM gets no answer (unit) | `isAdmin` false for other IDs and when ADMIN_USER_ID unset/empty | test/text.test.js "isAdmin — …" (2 tests) | PASS |
| AC1 gate wired before any reply | DM check returns before greeting/help/askHermes | hermes-discord-bot-clean.js server-restriction block; expert review | PASS |
| AC2 explicit toolset on every askHermes call | fresh and resume argv both carry exactly one `-t web` | test/hermes-cli.test.js "buildAskArgs — …" (3 tests) | PASS |
| AC2 link flow already pinned | runLinkSummary passes `-t web` | unchanged code, read at hermes-cli.js runLinkSummary | PASS |
| No regression | tests, lint, format | npm test; npx eslint .; npx prettier --check . | PASS: 157/157 (+5) |
| AC1 live: DM from a non-admin account | no reply, no 👀, no Hermes call in `pm2 logs` | manual, after deploy | PENDING: deploy |
| AC1 live: DM from the admin | still answered | manual, after deploy | PENDING: deploy |
| AC2 live: profile default audit | `hermes -p discord-bot-021 tools --summary` on the VPS recorded on the issue | manual, VPS | PENDING: VPS |
| Issue lifecycle | comment before solve | rad issue show 5cd6f24 | PENDING: merge |
