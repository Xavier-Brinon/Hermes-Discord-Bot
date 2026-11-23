---
artifact_type: change_boundary
task_id: stop-publishing-env
timestamp: 2026-11-18T22:47:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `README.md` | delete §Secrets, drop its one link | modify |
| `.gitignore` | ignore `.env` and `private/` | modify |
| `.env` | stop publishing it | untrack (file kept) |

## Out-of-Bound List
- Runtime code, tests, `manage_hermes.sh`, `AGENTS.md`, `GLOSSARY.org`, `ops/rotate-secrets.sh`.

## Orthogonal Issues (noticed, skipped)
- `ops/rotate-secrets.sh` hard-codes the private key path and backup file names: same secret-layout detail, tracked separately.
- README §Project structure and §After a reboot still mention `.env` / `.env.keys` by name only (no paths of the key): left.

## Orphan Tracking
- None.
