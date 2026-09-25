---
artifact_type: verification_matrix
task_id: hermes-profile
timestamp: 2026-09-25T07:32:34Z
complexity_score: 4
complexity_tier: STANDARD
---

## Complexity Score
Scope 2 (5 files) + Ambiguity 0 (option chosen by user) + Risk 2 (every Hermes call's argv) + Knowledge Gap 0 = **4 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Default + override | unset → `discord-bot`; set → value | test/modules.test.js "HERMES_PROFILE defaults…" | PASS |
| Unset = today's argv | `-p discord-bot --resume abc -t web chat …` and `-p discord-bot chat …` | stub-binary argv capture (scratchpad argv.ts) | PASS |
| Override reaches both call sites | `-p discord-bot-021` in askHermes and summarizeLink, splice offsets intact | stub-binary argv capture | PASS |
| Recap eval honours it | `runHermes(bin, profile, …)` | code read; eval not run locally (no Mistral locally) | PASS (static) |
| No regression | tests, lint, format | `npm test`; `npx eslint .`; `npx prettier --check .` | PASS — 131/131 (+1) |
| Live: recap eval on 0.21 profile | eval runs against discord-bot-021 | VPS | PENDING — live |
| Issue lifecycle documented | comment before solve | `rad issue show 336fafc` | PENDING — lands at merge |
