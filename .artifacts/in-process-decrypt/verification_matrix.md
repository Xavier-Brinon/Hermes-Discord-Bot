---
artifact_type: verification_matrix
task_id: in-process-decrypt
timestamp: 2026-11-18T15:57:05Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Complexity Score
Scope 2 (8 files) + Ambiguity 1 (PM2 env capture and key lookup to establish) + Risk 2 (startup path, secrets) + Knowledge Gap 1 (dotenvx and PM2 internals read in source) = **6 → COMPLEX**. User confirmed the plan 2026-11-18.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| In-process decryption | value decrypted with the key next to .env, from another cwd | test/load-env.test.js "decrypts with the .env.keys next to .env…" | PASS |
| Symlinked key (VPS layout) | decrypts through a `.env.keys` symlink to another dir | "decrypts through a .env.keys symlink…" | PASS |
| Fail closed | missing key throws MISSING_PRIVATE_KEY; real entrypoint stops at startup | "throws when .env.keys is missing…"; `node hermes-discord-bot-clean.js` without keys | PASS |
| No override | a launcher-set variable wins | "keeps a variable that is already set…" | PASS |
| Launch path | no `dotenvx run` in manage_hermes.sh start/restart, npm start, pm2:* | diff + Expert Review Q4 | PASS |
| Expert Review | no critical finding | 3 important findings applied (.bak, pm2 env doc, pm2 kill in deploy) | PASS |
| No regression | tests, lint, format, shell syntax | node --test; npx eslint .; npx prettier --check .; bash -n | PASS: 170/170 (+4) |
| AC no plaintext in dump | `grep -c DISCORD_BOT_TOKEN /data/.pm2/dump.pm2*` = 0 each | VPS, after `pm2 kill` + start + `rm dump.pm2.bak` | PENDING: deploy |
| AC /proc clean | `/proc/<bot pid>/environ` and daemon environ hold no DISCORD_BOT_TOKEN (count) | VPS, after deploy | PENDING: deploy |
| AC .env.keys | 0600 file in 0700 private key dir, workspace symlink, password-manager backup | VPS `ls -l`; owner confirmed backup | PASS (stopgap 2026-11-18) |
| AC logs | grep of PM2 logs + .autostart.log after Q&A/📝/recap finds no secret | VPS, after deploy | PENDING: deploy |
| AC README §Secrets | inventory, restore, rotation, leak rule | README.md §Secrets | PASS |
| Rotation | keypair, DISCORD_BOT_TOKEN, revoke HERMES_DISCORD_TOKEN | VPS + Discord portal | PENDING: after deploy |
| Issue lifecycle | comment before solve | rad issue show e39e496 | PENDING: merge |
