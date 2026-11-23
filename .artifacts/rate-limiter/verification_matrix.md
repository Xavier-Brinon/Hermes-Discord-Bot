---
artifact_type: verification_matrix
task_id: rate-limiter
timestamp: 2026-11-23T21:28:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Global concurrency cap | At most 2 slots active simultaneously; 3rd call rejected with `reason: 'concurrency'` until a slot is released | `test/rate-limit.test.js` concurrency test | PASS |
| Per-user sliding window | 3 calls within 60s succeed for a user; 4th is rejected with `reason: 'rate'`; after 60s elapses, next call succeeds | `test/rate-limit.test.js` sliding-window test | PASS |
| Admin exemption | Admin bypasses per-user rate window while still respecting global concurrency cap | `test/rate-limit.test.js` admin test | PASS |
| Safe release on error & idempotency | Calling `release()` twice never decrements below 0; rejected async task wrapped in `try/finally` releases slot | `test/rate-limit.test.js` release & error test | PASS |
| Entrypoint wiring | Recap, Q&A, and `📝` reaction paths check limiter before spawning Hermes and always release in `finally`; mentions reply in French, reactions stay retryable | `node -c hermes-discord-bot-clean.js`, `test/modules.test.js`, diff review | PASS |
| No regression | Full unit suite, eslint, prettier, and frontmatter/precomputation/shakedown linters pass | 177/177 non-jorf + 12/12 jorf = 189/189 tests, eslint 0, prettier clean | PASS |
