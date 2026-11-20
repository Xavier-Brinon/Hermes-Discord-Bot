---
artifact_type: change_boundary
task_id: neutral-hermes-cwd
timestamp: 2026-11-18T19:37:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `config.js` | `HERMES_CWD` constant | modify |
| `hermes-cli.js` | `cwd` on both Hermes chat calls, context file in that dir | modify |
| `test/hermes-cwd.test.js` | real-child test of cwd and offload | create |
| `prompts.js` | stale cwd comment | modify |
| `README.md` | §Secrets paragraph on where Hermes runs | modify |
| `test/context-refs.test.js` | AMENDMENT (during coding): point `HERMES_CWD` at its temp dir, the default `/data/hermes-cwd` cannot be created off the VPS | modify (1 line) |

## Out-of-Bound List
- `child-env.js`, `hermes-discord-bot-clean.js`, `manage_hermes.sh`, `.env`.
- `evals/run-recap-eval.js`.

## Orthogonal Issues (noticed, skipped)
- `evals/run-recap-eval.js` calls Hermes with no `cwd`, so a local eval run from the repo still loads AGENTS.md: eval prompts differ slightly from prod. Dev-only, not a leak.

## Orphan Tracking
- None.
