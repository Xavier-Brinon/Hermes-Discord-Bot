---
artifact_type: change_boundary
task_id: rotate-secrets-wizard
timestamp: 2026-11-18T17:56:47Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `ops/rotate-secrets.sh` | the rotation wizard | create |
| `README.md` | link it from §Rotation | modify |

## Out-of-Bound List
- `.env`, bot source files, `manage_hermes.sh`, `test-token.js`.

## Orthogonal Issues (noticed, skipped)
- `manage_hermes.sh` start banner still says "(dotenvx-secured)"; still roughly true, left alone.
- shellcheck SC1087 in the vendored wizard library (`ask`): false positive, library not edited.

## Orphan Tracking
- None.
