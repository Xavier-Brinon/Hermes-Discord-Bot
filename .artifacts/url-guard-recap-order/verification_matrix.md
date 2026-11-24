---
artifact_type: verification_matrix
task_id: url-guard-recap-order
timestamp: 2026-11-24T11:06:20Z
complexity_score: 4
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| `isRecapRequest` excludes URLs | Returns `false` for `résume http://127.0.0.1/`, `résume https://example.com`, `summarize https://example.com`, replies, and DMs; returns `true` for `résume la semaine` | `test/recap.test.js` `isRecapRequest` tests | PASS |
| Entrypoint guard order | `findBlockedUrl` appears before `isRecapRequest` and before every `askHermes` call in `hermes-discord-bot-clean.js` | `test/url-guard.test.js` entrypoint ordering test | PASS |
| Escape postmortem | `docs/postmortems/20261124T110355--run-url-guard-before-recap-routing.org` exists, covers timeline/root cause/why missed/changes, and passes `org-review-lint.el` | `org-review-lint.el` (0 findings) | PASS |
| No regression | Full unit suite, eslint, prettier, and review gate linters pass | 180/180 non-jorf (+12 jorf = 192), eslint 0, prettier clean | PASS |
