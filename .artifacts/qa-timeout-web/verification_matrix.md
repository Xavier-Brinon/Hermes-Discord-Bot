---
artifact_type: verification_matrix
task_id: qa-timeout-web
timestamp: 2026-11-19T21:40:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (config.js, hermes-cli.js, one test file) + Ambiguity 0 (cause measured: `flow=resume web=no outcome=timeout elapsed=91.8s limit=90s`) + Risk 1 (shared Hermes call path) + Knowledge Gap 0 = **2 → TRIVIAL**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Every askHermes call gets TIMEOUT_WEB | `customTimeout \|\| TIMEOUT_WEB`; no TIMEOUT_NORMAL left | `rg TIMEOUT_NORMAL` | PASS (none) |
| A kill names the timeout | detail starts `Délai dépassé (150 s)`, stderr kept | test/hermes-cli.test.js cliErrorDetail x3 | PASS |
| Other failures unchanged | detail = stderr, else error.message | same tests | PASS |
| Both admin notifications fixed | Q&A and 📝 error paths use cliErrorDetail | diff review | PASS |
| Suite, lint, format | node --test, eslint, prettier | `aube run test/lint` | PASS (176/176, clean) |
| Live: a reply that searches answers | no kill at 90 s; resumed chat continues | Discord, after deploy | PENDING: deploy |
