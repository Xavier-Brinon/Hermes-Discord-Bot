---
artifact_type: change_boundary
task_id: child-env-allowlist
timestamp: 2026-11-18T13:56:45Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `child-env.js` | allowlist helper | create |
| `hermes-cli.js` | env on askHermes, runLinkSummary, probeHermes | modify |
| `youtube.js` | env on runYtDlp | modify |
| `jorf.js` | env on tar | modify |
| `evals/run-recap-eval.js` | env on the eval's Hermes call | modify |
| `test/child-env.test.js` | tests | create |
| `README.md` | §Security bullet | modify |

## Out-of-Bound List
- `hermes-discord-bot-clean.js`, `manage_hermes.sh`, `package.json`, `.env`: issue e39e496.
- `ops/hermes-hooks/`: unchanged.

## Orthogonal Issues (noticed, skipped)
- HERMES_DISCORD_TOKEN in `.env` is unused by code: folded into e39e496.
- The repo `.env` has 6 keys, the VPS one 8 (HERMES_BIN, HERMES_PROFILE): the two have diverged; noted for e39e496.

## Orphan Tracking
- None.
