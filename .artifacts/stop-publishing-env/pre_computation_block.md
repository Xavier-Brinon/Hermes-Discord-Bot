---
artifact_type: pre_computation_block
task_id: stop-publishing-env
timestamp: 2026-11-18T22:47:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Prod reads the VPS `.env`, not the repo copy: the tracked `.env` last changed in 81e6ba4 (6 keys); the VPS has 8 keys and local changes. | HIGH |
| 2   | `git rm --cached .env` keeps the local file; tests and the bot do not need `.env` tracked (test/load-env.test.js builds its own in a temp dir). | HIGH |
| 3   | On the VPS, a `git pull` of this commit deletes `.env`, or refuses because of the local changes; either way `.env` must be backed up first and restored after. | HIGH |
| 4   | Nothing in the repo links to README §Secrets except the Watch points bullet. | HIGH (rg) |
| 5   | A gitignored `private/` directory is never published by git push (GitHub or Radicle). | HIGH |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | `git log --oneline -- .env`; `grep -o '^[A-Z_]*=' .env` | stale | last 81e6ba4; 6 keys | 2026-11-18T22:35:00Z | PASS |
| 2   | `rg -n "\.env" load-env.js test/load-env.test.js` | temp-dir fixture | fixture in a temp dir | 2026-11-18T22:45:00Z | PASS |
| 3   | git semantics of a deleted tracked file on pull | file removed | known behaviour; VPS procedure backs up first | 2026-11-18T22:45:00Z | PASS |
| 4   | `rg -n "Secrets"` | one link | README.md:80 only | 2026-11-18T22:45:00Z | PASS |
| 5   | `git check-ignore private/secrets-runbook.org` after edit | ignored | `.gitignore:29:private/` matches | 2026-11-18T22:46:00Z | PASS |

## Scope Declaration

### Files in scope
- `README.md`: delete §Secrets; drop "(see §Secrets)" from Watch points.
- `.gitignore`: ignore `.env` and `private/`.
- `.env`: untracked (`git rm --cached`), file kept locally.
- `private/secrets-runbook.org` (gitignored, not in the diff): the removed section, in Org.

### Files off-limits
- All runtime code, tests, `manage_hermes.sh`, `AGENTS.md`, `GLOSSARY.org`.
- `ops/rotate-secrets.sh` (also names the secret paths; flagged as orthogonal, needs a user decision).

## Interpretations of the request
- "Remove that section" = the whole README §Secrets (Where each secret lives, Restore, Rotation, Delete HERMES_DISCORD_TOKEN); its content is kept privately, not lost.

## Alternatives considered
- Fresh repo without history: rejected with the user (loses the Radicle issue/patch trail, history already copied).
- Shorten §Secrets instead of deleting it: user asked for removal.
