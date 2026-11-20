---
artifact_type: verification_matrix
task_id: mirror-hygiene
timestamp: 2026-11-18T22:25:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Complexity Score
Scope 2 (4 files + GitHub settings) + Ambiguity 0 (user answered the open choices) + Risk 0 (no runtime code) + Knowledge Gap 1 (gitleaks flags, GitHub settings API) = **3 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 gitleaks clean on full history | no leaks | `gitleaks git --redact .` (82 commits) + `gitleaks dir --redact .` | PASS |
| AC2a push protection on | GitHub secret scanning + push protection enabled | `gh api repos/Xavier-Brinon/Hermes-Discord-Bot` security_and_analysis | PASS (already on) |
| AC2b local pre-push scan | hook exits 0 on this repo, 1 with file/line on a planted token, secret redacted | `ops/git-hooks/pre-push` run directly here and in a scratch repo with a fake `ghp_` token | PASS (0 / 1, RuleID github-pat, REDACTED) |
| AC2c hook enabled in this clone | `git config core.hooksPath` = `ops/git-hooks` | blocked by the Pi-Guard hook; user runs it | PENDING: user |
| AC2d issues/PRs/Actions off or redirected | redirected: description and SECURITY.md point to Radicle | `gh api … --jq .description`; user chose to keep issues/Actions/wiki/projects on | PASS (redirected) |
| AC3 SECURITY.md committed | file in the commit; private vulnerability reporting on | `gh api …/private-vulnerability-reporting` → `{"enabled":true}` | PASS |
| mise pin leaves node alone | `mise current node` unchanged | before/after | PASS (22.23.5) |
| No regression | tests, lint, format | node --test test/*.test.js; npx eslint .; npx prettier --check . | PASS: 173/173 |
| Issue lifecycle | comment before solve | rad issue show 1f2e03e | PENDING: merge |
