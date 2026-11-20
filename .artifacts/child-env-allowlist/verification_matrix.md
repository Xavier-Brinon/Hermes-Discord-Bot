---
artifact_type: verification_matrix
task_id: child-env-allowlist
timestamp: 2026-11-18T14:20:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Complexity Score
Scope 2 (7 files) + Ambiguity 1 (which variables each child needs) + Risk 2 (every Hermes call, security) + Knowledge Gap 1 (Hermes env loading read in its source) = **6 → COMPLEX**. User confirmed the split and the strict allowlist 2026-11-18.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 allowlist drops secrets | DISCORD_BOT_TOKEN, HERMES_DISCORD_TOKEN, DOTENV_PRIVATE_KEY, HERMES_WEBUI_PASSWORD, ADMIN_USER_ID absent; PATH/HOME/HERMES_HOME/LC_* kept | test/child-env.test.js "drops the bot secrets…" | PASS |
| AC1 real child does not see the token | fake `--version` binary prints `token=absent` | test/child-env.test.js "a real child…"; fails with `token=leaked` when hermes-cli.js is reverted | PASS |
| AC1 every launcher passes env | per file, child_process launcher calls == `env: childEnv()` | test/child-env.test.js "every execFile call…" | PASS |
| No regression | tests, lint, format | node --test test/*.test.js; npx eslint .; npx prettier --check . | PASS: 160/160 (+3) |
| Expert Review | independent reviewer, no critical/important finding | review report 2026-11-18; both notes applied (wider launcher regex, PYTHONUTF8/PYTHONIOENCODING) | PASS |
| Live: Q&A, 📝 link summary (YouTube), recap | answers as before; startup log shows the Hermes version line | manual, after deploy | PENDING: deploy |
| Issue lifecycle | comment before solve | rad issue show 03dee16 | PENDING: merge |
