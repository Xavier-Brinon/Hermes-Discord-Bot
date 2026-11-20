---
artifact_type: change_boundary
task_id: mirror-hygiene
timestamp: 2026-11-18T22:20:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `SECURITY.md` | how to report a vulnerability | create |
| `ops/git-hooks/pre-push` | gitleaks before every push | create |
| `mise.toml` | pin gitleaks for the hook | create |
| `README.md` | §Maintenance: enable the hook | modify |

## Out-of-Bound List
- All runtime code and config (`*.js`, `manage_hermes.sh`, `.env`, `package.json`, `package-lock.json`).
- Recon trim of README / SESSION_LOG / .artifacts (user: keep).

## Orthogonal Issues (noticed, skipped)
- README §Maintenance says `npm update`; the project uses aube. Belongs to 675f647 (dependency audit via aube).

## Orphan Tracking
- None.
