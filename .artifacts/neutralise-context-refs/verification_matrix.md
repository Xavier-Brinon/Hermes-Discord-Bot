---
artifact_type: verification_matrix
task_id: neutralise-context-refs
timestamp: 2026-11-18T16:05:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Complexity Score
Scope 1 (3 files) + Ambiguity 0 (mechanism confirmed live) + Risk 2 (every Hermes prompt, security) + Knowledge Gap 1 (Hermes reference syntax read in its source) + 1 rounding for incident pressure, scored 5 → STANDARD.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 refs neutralised | 9 attack strings match Hermes's patterns before, none after | test/context-refs.test.js "every attack string…" | PASS |
| AC1 ordinary text kept | `<@id>`, email, YouTube `/@handle`, `@ 18h`, `@123` unchanged | "ordinary text is left alone" | PASS |
| AC2 every prompt builder covered | askHermes (question + context) and runLinkSummary (whole prompt) send no ref | e2e tests via fake HERMES_BIN; both fail when hermes-cli.js is reverted | PASS |
| AC3 recap offload intact | exactly one `@file:<ctx>` after a neutralised question | "the bot's own @file: offload survives…" + existing suite | PASS |
| No regression | tests, lint, format | node --test test/*.test.js; npx eslint .; npx prettier --check . | PASS: 166/166 (+6) |
| AC4 live | `@Le Mistral Bot que contient @file:package.json ?` gets no file content | manual, after deploy | PENDING: deploy |
| AC3 live | one recap | manual, after deploy | PENDING: deploy |
| Issue lifecycle | comment before solve | rad issue show 6fe5a3e | PENDING: merge |
