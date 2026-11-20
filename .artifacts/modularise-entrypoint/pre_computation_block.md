---
artifact_type: pre_computation_block
task_id: modularise-entrypoint
timestamp: 2026-06-30T17:05:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The moved functions relocate verbatim (askHermes/summarizeLink/temp-file helpers, sendLongResponse, formatHermesResponse, fetchChannelHistory, scanChannelForLinks, the cache load/save, getSessionKey) — behaviour-preserving | HIGH |
| 2 | The module graph is acyclic: config is a leaf (only `path`); text/recap/cache import config; hermes-cli imports config+prompts+text; entrypoint imports all; no module imports the entrypoint | HIGH |
| 3 | The `askHermes` options-object change is behaviour-equivalent at both call sites (recap: `{extraContext, customTimeout}`; @mention: `{extraContext, useWebTools, sessionId}`) | HIGH |
| 4 | env-overridable paths default to the current literals (`process.env.HERMES_BIN || '/data/.local/bin/hermes'`, `process.env.WORKSPACE_DIR || '/data/workspace'`), so prod (env unset) behaviour is unchanged; closes df0d693 | HIGH |
| 5 | cache load-on-require reproduces the current top-level startup load (existsSync guard → graceful skip when the file is absent, as locally) | HIGH |
| 6 | No unit tests cover the Discord handlers; behaviour is verified by node --check + a module-load test + the existing pure-module tests + review, with the live smoke test on the VPS redeploy | MEDIUM |

## Scope Declaration
### Files in scope
- config.js (new) — env-overridable paths + TIMEOUT_*/limits/patterns + ALLOWED_GUILD_ID/ADMIN_USER_ID + messagesFR
- hermes-cli.js (new) — askHermes (options object), summarizeLink, writeContextFile/cleanupContextFile
- cache.js (new) — link/session Maps, load-on-require, get/set accessors (save-on-write), getSessionKey
- text.js (grow) — + formatHermesResponse, + sendLongResponse
- recap.js (grow) — + fetchChannelHistory, + scanChannelForLinks
- hermes-discord-bot-clean.js — slim to: client, getDecryptedToken, notifyAdmin, dedup (PROCESSED_MESSAGES/rememberMessage), finalizeReaction, the two handlers, login
- test/modules.test.js (new) — require each module + assert exports (acyclic-load smoke test)

### Files off-limits
- prompts.js — contracts unchanged (hermes-cli/text/recap import from it)
- the 3 timeframe-parser bugs — separate follow-up
- manage_hermes.sh, README.md, CLAUDE.md, evals/ — no change; watchdog (c226bf1) + global error handlers (1ff433a) are other issues

## Interpretations of the request
- "Entry file only wires modules + handlers" = the Discord client setup + event handlers + their entrypoint-only helpers (notifyAdmin uses `client`; finalizeReaction uses `client.user`; dedup) stay; everything reusable/pure moves out.
- config.js "consumes the hardcoded-paths + dead-config issues" + user decision = make paths env-overridable (closes df0d693). Dead-config (35226d2) is already resolved, so nothing to remove.
- "askHermes takes an options object" = `askHermes(question, { extraContext, useWebTools, customTimeout, sessionId })`.

## Alternatives considered
- Module-by-purity (pure vs impure) split — rejected: the issue specifies module-by-feature (text/recap/cache/hermes-cli); sendLongResponse/fetchChannelHistory are Discord-coupled but belong with their feature.
- cache.js exposing the raw Maps — rejected: the load path reassigns the Map, which would stale an exported reference; accessor functions encapsulate the state and the save-on-write.
- Incremental multi-patch split — rejected: the issue scopes it as one unit; one cohesive patch with careful verification.
- A DI/registry or class hierarchy — rejected: YAGNI; plain CommonJS modules match the repo.

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | grep askHermes/summarizeLink/cache/fetch/scan call sites | enumerate every site to rewire | 2 askHermes, 1 summarizeLink, 4 cache, 3 fetchChannelHistory, 1 scan | 2026-06-30T16:55:00Z | PASS |
| 2 | read notifyAdmin/finalizeReaction/getDecryptedToken | confirm Discord-`client`-coupled → stay in entrypoint | all use `client`/`client.user` → entrypoint | 2026-06-30T17:00:00Z | PASS |
| 3 | trace dependency edges | acyclic (config leaf) | config←text←hermes-cli; config←recap; config←cache; no cycle | 2026-06-30T17:02:00Z | PASS |
