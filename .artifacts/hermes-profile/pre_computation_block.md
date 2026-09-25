---
artifact_type: pre_computation_block
task_id: hermes-profile
timestamp: 2026-09-25T07:31:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Unset `HERMES_PROFILE` → `discord-bot` → argv identical to today. | HIGH |
| 2   | The gateway hook strips every inherited `HERMES_*` (README §After a reboot), so `HERMES_BIN`/`HERMES_PROFILE` must be set in the encrypted `.env` via `dotenvx set`, never the shell. | HIGH |
| 3   | Each profile has its own `state.db`, so a session_id cached under one profile cannot be resumed under the other; the cutover and rollback clear `.session_cache.json` (a reply then starts a fresh session, as for an evicted entry). | HIGH |

## Scope Declaration

### Files in scope
- `config.js` — **modify**. `HERMES_PROFILE` constant + export.
- `hermes-cli.js` — **modify**. Both `-p` sites use it.
- `evals/run-recap-eval.js` — **modify**. Eval honours `HERMES_PROFILE` like it honours `HERMES_BIN`.
- `test/modules.test.js` — **modify**. Export list + env-override test.
- `README.md` — **modify**. Cutover / rollback runbook.

### Files off-limits
- `hermes-discord-bot-clean.js`, `prompts.js`, `cache.js` — unaffected by which profile runs.
- `manage_hermes.sh`, `ops/` — the hook already lets `.env` decide.
- The profile config itself — a VPS change, recorded on issues 1ae5380 / 05776ff.

## Interpretations of the request
1. **(Chosen)** Env-overridable profile, cutover = two `.env` vars (recommended option 3).
2. (Rejected) Edit the live profile in place — rollback would need a config edit and 0.16's tolerance of `model_overrides` is unverified.

## Gold Standard cited
`examples/patterns/surgical-diff.md`.
