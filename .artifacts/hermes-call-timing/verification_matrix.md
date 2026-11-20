---
artifact_type: verification_matrix
task_id: hermes-call-timing
timestamp: 2026-10-05T10:17:09Z
complexity_score: 3
complexity_tier: STANDARD
---

## Complexity Score
Scope 2 (4 files) + Ambiguity 0 (issue lists the ACs) + Risk 1 (shared Hermes call path, log-only) + Knowledge Gap 0 (code read this session) = **3 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Line format | key=value fields, one-decimal elapsed, whole-second limit, web yes/no | test/hermes-cli.test.js "formatTimingLine" | PASS |
| One line per exit path | askHermes: error/timeout, ok; runLinkSummary: error/timeout, abstain (max-turns), abstain (sentinel), ok | code read: 6 `logTiming(` calls, one per branch before each return/resolve | PASS (static) |
| Flow labels | ask / resume (sessionId) / recap (explicit) / link | code read: default param + recap call site | PASS (static) |
| Read-out works | per-flow n, p50, p95, max, timeouts from pm2-prefixed lines | pipeline run on a sample of pm2-style lines | PASS |
| Existing lines kept | 📥 / ❌ / HERMES OUTPUT lines unchanged | git diff | PASS |
| No regression | tests, lint, format | npm test; eslint; prettier | PASS: 140/140 (+1) |
| Live: lines appear in pm2 logs | one ⏱️ line per @mention / 📝 / recap | VPS after deploy | PENDING: live |
| Issue lifecycle | comment before solve | rad issue show 6b61611 | PENDING: merge |
