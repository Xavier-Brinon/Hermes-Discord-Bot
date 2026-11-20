---
artifact_type: verification_matrix
task_id: help-reply-to-continue
timestamp: 2026-09-23T14:00:16Z
complexity_score: 0
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 0 (config.js) + Ambiguity 0 + Risk 0 (one French string) + Knowledge Gap 0 = **0 → TRIVIAL** (Skill D only).

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Help lists reply-to-continue | one bullet added to `messagesFR.helpContent`, French, `vous` register | render helpTitle + '\\n\\n' + helpContent via node | PASS — "• Poursuivre une conversation : répondez (↩) à l'un de mes messages" |
| No regression | tests, lint, format clean | `npm test`; `npx eslint .`; `npx prettier --check .` | PASS — 124/124; 0 problems; formatted |
| `@bot aide` shows the line | live at deploy | mention the bot with "aide" | PENDING — live |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show c91b6a0` | PENDING — lands at merge |
