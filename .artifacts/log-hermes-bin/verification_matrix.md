---
artifact_type: verification_matrix
task_id: log-hermes-bin
timestamp: 2026-09-24T17:22:41Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (hermes-cli.js, hermes-discord-bot-clean.js, test/hermes-cli.test.js) + Ambiguity 0 (issue lists the ACs) + Risk 0 (startup log, best-effort, never rejects) + Knowledge Gap 0 = **1 → TRIVIAL** (Skill D only).

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Resolved absolute path logged | `probeHermes` resolves a bare name on PATH, follows symlinks | test/hermes-cli.test.js (absolute, symlink, bare name); local smoke `probeHermes('hermes')` | PASS — /Users/xavierbrinon/.local/bin/hermes |
| Version logged, best-effort | first non-empty `--version` line; a failing `--version` keeps the path, version null, no throw | test/hermes-cli.test.js (absolute, --version fails) | PASS — "Hermes Agent v0.21.3 (2026.9.14) …" locally |
| Missing / non-executable reported loudly once | path null + error; ready handler logs ❌ and DMs the admin | test/hermes-cli.test.js (missing, non-executable); local smoke of the default /data path | PASS — "/data/.local/bin/hermes not found or not executable" |
| No regression | tests, lint, format clean | `npm test`; `npx eslint .`; `npx prettier --check .` | PASS — 131/131 (+6); 0 problems; formatted. Re-run after rebase onto 1337991 (2026-09-25): 141/141 |
| Profile named in the log (added at rebase) | startup line ends `— profil ${HERMES_PROFILE}` — the second variable the 0.21 cutover had to check via `pm2 env` | code read | PASS (static) |
| VPS startup line | after restart, PM2 log shows the 0.16 path + version | `./manage_hermes.sh restart` then logs | PENDING — live |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show 9afaeac` | PENDING — lands at merge |
