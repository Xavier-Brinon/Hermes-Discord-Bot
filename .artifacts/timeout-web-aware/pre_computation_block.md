---
artifact_type: pre_computation_block
task_id: timeout-web-aware
timestamp: 2026-06-24T21:37:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `HERMES_CONFIG` is dead — referenced nowhere except its own definition | HIGH |
| 2 | The `-t web` call path is what timed out in prod (62.3s > 60s default) | HIGH |
| 3 | A web-search default of 150s gives comfortable headroom over the 62.3s failure without risking a Discord-side limit (message replies have no hard deadline) | MEDIUM |
| 4 | `summarizeLink` (also a `-t web` call, hardcoded 60s) should share the web timeout — same class of slow call | MEDIUM |
| 5 | Recap's existing 120s is correct as-is and only needs to become a named constant | HIGH |
| 6 | `DISCORD_MSG_LIMIT = 1900` is already the sole message-length authority; the dead `maxResponseLength: 2000` just needs deleting | HIGH |

## Scope Declaration
### Files in scope
- hermes-discord-bot-clean.js — replace dead `HERMES_CONFIG` with explicit timeout constants; make `askHermes` web-aware; name the recap timeout; raise `summarizeLink` to the web timeout

### Files off-limits
- prompts.js — prompt content, unrelated to timeouts
- README.md — operational runbook; grep shows no `HERMES_CONFIG`/timeout value to update (only an unrelated "60s" watchdog interval)
- CLAUDE.md — architecture doc, no timeout values stated
- hermes_watchdog.sh / manage_hermes.sh / package.json — deploy harness, orthogonal
- the Hermes output parser (banner/`──` extraction) — untouched coupling point

## Interpretations of the request
- "align answer timeout with comment" = make the real normal-Q&A timeout equal the documented 90s, AND give the slower `-t web` path its own larger budget (per issue comment dcefbc4), since 60s for web is the exact case that failed in prod
- Alternate reading rejected: "just bump the single 60s default to 90s" — would still under-serve `-t web` (the failing case needed >62s and web calls are structurally slower than plain Q&A)

## Alternatives considered
- Wire `HERMES_CONFIG` back in as the single source of truth (issue's "either/or" option A) — rejected: a config object with one consumer is indirection without payoff; explicit named constants read better and the dead `maxResponseLength` would just be revived noise (see `examples/anti-patterns/god-object.md`)
- One flat default bumped 60s → 90s for all paths — rejected: doesn't fix the web case, which is the prod failure
- Make web timeout configurable via env var — rejected: YAGNI, no second consumer; a constant is enough

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -rn "HERMES_CONFIG" --include="*.js" .` | only line 82 (the definition) | only `hermes-discord-bot-clean.js:82` | 2026-06-24T21:35:00Z | PASS |
| 2 | `grep -n "maxResponseLength\|DISCORD_MSG_LIMIT" hermes-discord-bot-clean.js` | maxResponseLength only at :84; limit used is DISCORD_MSG_LIMIT | maxResponseLength@84 (dead); DISCORD_MSG_LIMIT@368,421,427,826 | 2026-06-24T21:35:00Z | PASS |
| 3 | `grep -n "timeout:" hermes-discord-bot-clean.js` | 60000 defaults at askHermes + summarizeLink; 120000 at recap call | :196 customTimeout\|\|60000, :259 60000, :698 call 120000 | 2026-06-24T21:35:00Z | PASS |
