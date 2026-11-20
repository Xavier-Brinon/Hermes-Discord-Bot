---
artifact_type: verification_matrix
task_id: summary-title-fallback
timestamp: 2026-09-25T08:02:29Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (prompts.js, bot, test/prompts.test.js) + Ambiguity 0 + Risk 1 (thread title only) + Knowledge Gap 0 = **2 → TRIVIAL** (Skill D only).

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| « titre » extracted | intro line's guillemets content | test/prompts.test.js "the « titre » of the intro line" | PASS |
| Intro line only | « » further down ignored | test/prompts.test.js "only the intro line counts" | PASS |
| Abstention / empty → null | generic title kept; linkUnreadable has no « » (config.js:117) | test/prompts.test.js "abstention, empty or missing" | PASS |
| Embed title still wins | `meta?.title \|\| titleFromSummary(...)` | code read | PASS (static) |
| No regression | tests, lint, format | npm test; eslint; prettier | PASS — 134/134 (+3) |
| Live: no-embed link | thread named after the article | Discord after deploy | PENDING — live |
| Issue lifecycle | comment before solve | rad issue show 0ffd609 | PENDING — merge |
