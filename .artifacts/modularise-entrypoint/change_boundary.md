---
artifact_type: change_boundary
task_id: modularise-entrypoint
timestamp: 2026-06-30T17:07:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `config.js` | New: env-overridable paths (closes df0d693) + timeouts/limits/patterns + IDs + messagesFR | create |
| `hermes-cli.js` | New: askHermes (→ options object), summarizeLink, writeContextFile/cleanupContextFile | create |
| `cache.js` | New: link/session Maps, load-on-require, get/set accessors, getSessionKey | create |
| `text.js` | Grow: + formatHermesResponse, + sendLongResponse | modify |
| `recap.js` | Grow: + fetchChannelHistory, + scanChannelForLinks | modify |
| `hermes-discord-bot-clean.js` | Slim to client + handlers + notifyAdmin/finalizeReaction/dedup; rewire to imports; askHermes call sites → options object | modify |
| `test/modules.test.js` | New: require each module + assert exports (acyclic-load smoke) | create |
| .artifacts/modularise-entrypoint/pre_computation_block.md | Skill A artifact | create |
| .artifacts/modularise-entrypoint/simplicity_review.md | Skill B artifact | create |
| .artifacts/modularise-entrypoint/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/modularise-entrypoint/verification_matrix.md | Skill D artifact | create |
| .artifacts/modularise-entrypoint/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- prompts.js — contracts unchanged; imported, not edited
- the 3 timeframe-parser bugs (recap.js logic) — separate follow-up, not fixed here
- manage_hermes.sh, README.md, CLAUDE.md, evals/ — no run/ops/doc/eval change
- c226bf1 (watchdog), 1ff433a (global error handlers) — other issues
- the messageCreate handler's control flow — preserved verbatim, only its callees move

## Creation Order (if ordering matters)
1. config.js — leaf; text.js/recap.js/cache.js/hermes-cli.js all import it
2. text.js (grown) — hermes-cli.js imports unwrapText from it
3. cache.js, recap.js, hermes-cli.js — then the entrypoint requires all of them

## Orthogonal Issues (noticed, skipped)
- df0d693 is folded in here (env-overridable paths) and will be closed alongside 950dc54 — per the issue text + user decision
- notifyAdmin/finalizeReaction are Discord-`client`-coupled and stay in the entrypoint (could move to a discord-util module later — not now)
- the repo is still not prettier-clean (deferred from 6115cc3); not addressed here

## Orphan Tracking
- After the move, the entrypoint's inline definitions of the relocated functions + their constants become unused — all deleted (no dangling copies); verified by grep + node --check
- `path` require in the entrypoint: still needed? Only if the entrypoint still uses it — if not, it moves to config.js/hermes-cli.js; check and drop the unused require
