---
artifact_type: change_boundary
task_id: neutralise-context-refs
timestamp: 2026-11-18T15:42:04Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `prompts.js` | `neutraliseContextRefs` | modify |
| `hermes-cli.js` | apply at the two prompt choke points | modify |
| `test/context-refs.test.js` | unit tests + end-to-end with a fake Hermes (one new file instead of the planned `test/prompts.test.js` edit + `test/hermes-cli-refs.test.js`, recorded at Post-Flight) | create |

## Out-of-Bound List
- `hermes-discord-bot-clean.js`, `recap.js`, `README.md`.

## Orthogonal Issues (noticed, skipped)
- Hermes deny-list misses `.env.keys`: upstream report worth filing.
- `@url:` SSRF also reachable through `-t web` tools: issue 7102348.

## Orphan Tracking
- None.
