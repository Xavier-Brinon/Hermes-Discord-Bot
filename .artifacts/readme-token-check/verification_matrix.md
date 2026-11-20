---
artifact_type: verification_matrix
task_id: readme-token-check
timestamp: 2026-09-23T14:00:16Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (README.md + test-token.js) + Ambiguity 0 + Risk 0 (ops utility, not loaded by the bot) + Knowledge Gap 0 = **1 → TRIVIAL** (Skill D only).

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| No README command prints a secret | `dotenvx get DISCORD_BOT_TOKEN` row replaced by `npx dotenvx run -f .env -- node test-token.js` | `grep -n 'dotenvx get' README.md` | PASS — 0 hits |
| Token never on a command line | test-token.js reads `DISCORD_BOT_TOKEN` from env, not argv | read the diff | PASS |
| Missing var: clear message | exit 1, names the var and dotenvx | `node test-token.js` | PASS — "DISCORD_BOT_TOKEN not found in environment…" |
| Still encrypted: clear message | found while testing: dotenvx without keys injects the `encrypted:` ciphertext, which Discord reports as "invalid token" | `npx dotenvx run -q -f .env -- node test-token.js` on the Mac (no .env.keys) | PASS — "still encrypted: .env.keys (or DOTENV_PRIVATE_KEY) is missing" |
| Invalid token: clear message, token not echoed | exit 1 | `DISCORD_BOT_TOKEN=not.a.token node test-token.js` | PASS — "Token invalid: An invalid token was provided." |
| No regression | tests, lint, format clean | `npm test`; `npx eslint .`; `npx prettier --check .` | PASS — 124/124; 0 problems; formatted |
| Valid token on the VPS | "✅ Token is valid! Logged in as …" | run the README command on the VPS | PENDING — live |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show bba75fe` | PENDING — lands at merge |
