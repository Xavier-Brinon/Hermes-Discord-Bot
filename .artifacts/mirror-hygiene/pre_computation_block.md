---
artifact_type: pre_computation_block
task_id: mirror-hygiene
timestamp: 2026-11-18T22:20:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | gitleaks finds no secret in the 82-commit history or the working tree, so the hook can scan the full history on every push without blocking. | HIGH (ran it) |
| 2   | Secret scanning and push protection are already on for the GitHub mirror. | HIGH (read via gh api) |
| 3   | A full-history scan is fast enough for a pre-push hook (82 commits in under 0.3 s). | HIGH (measured) |
| 4   | GitHub cannot turn pull requests off on a public repo; the description and SECURITY.md point contributors to Radicle instead. | HIGH |
| 5   | A project `mise.toml` pinning only gitleaks does not change how node is chosen (`.nvmrc` is still read as an idiomatic version file). | MEDIUM (check `mise current node` after) |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | `mise x gitleaks@latest -- gitleaks git --redact .` and `gitleaks dir --redact .` | no leaks | "82 commits scanned … no leaks found"; dir "no leaks found" | 2026-11-18T22:13:00Z | PASS |
| 2   | `gh api repos/Xavier-Brinon/Hermes-Discord-Bot` security_and_analysis | both enabled | secret_scanning enabled, push_protection enabled | 2026-11-18T22:12:50Z | PASS |
| 3   | same gitleaks run | &lt; 1 s | 276 ms | 2026-11-18T22:13:00Z | PASS |
| 4   | GitHub repo settings API | no has_pull_requests switch | none | 2026-11-18T22:12:50Z | PASS |
| 5   | `mise current node` with the new mise.toml | same node as before | node 22.23.5 before and after, gitleaks 8.30.1 added | 2026-11-18T22:20:05Z | PASS |

## Scope Declaration

### Files in scope
- `SECURITY.md` (new): private report via GitHub private vulnerability reporting; Radicle is canonical.
- `ops/git-hooks/pre-push` (new): `gitleaks git --redact` over the full history via mise; fail closed.
- `mise.toml` (new): pin gitleaks.
- `README.md`: §Maintenance one bullet on enabling the hook.
- GitHub settings (not files): private vulnerability reporting on; description points to Radicle; issues/Actions/wiki/projects per user answer.

### Files off-limits
- Every runtime file (`*.js`, `manage_hermes.sh`, `.env`, `package.json`).
- Recon trim: user chose KEEP, so README paths, SESSION_LOG and .artifacts stay as they are.

## Interpretations of the request
- "Push protection on" = GitHub secret scanning push protection (already on) plus the local gitleaks pre-push hook.
- "Contact shown as text" = the user picked GitHub private vulnerability reporting, so no address is published.

## Alternatives considered
- Scan only the pushed range (`remote_sha..local_sha`): more code (new-branch zero-SHA case) for no gain at 0.3 s per full scan.
- Husky / lefthook: a new dependency for one hook; `core.hooksPath` is built into git.
- A gitleaks GitHub Action: needs Actions on, which this task turns off.
