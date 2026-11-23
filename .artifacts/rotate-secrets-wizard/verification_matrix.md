---
artifact_type: verification_matrix
task_id: rotate-secrets-wizard
timestamp: 2026-11-18T17:56:47Z
complexity_score: 4
complexity_tier: STANDARD
---

## Complexity Score
Scope 1 (2 files) + Ambiguity 0 + Risk 2 (live secrets, irreversible token resets) + Knowledge Gap 1 (dotenvx rotate/armor, Discord API status) = **4 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Syntax | `bash -n` clean | `bash -n ops/rotate-secrets.sh` | PASS |
| Lint | shellcheck clean outside the vendored library | `shellcheck -S warning ops/rotate-secrets.sh` (only SC1087 in `ask`, library) | PASS |
| Library untouched | identical to the template above the STAGES marker | `diff` of both files up to the marker | PASS |
| No plaintext write | values only via `dotenvx set`/`rotate --no-armor`; no `write_env` call | read of the stages | PASS |
| No secret printed | only status codes, bot names, file names; new key shown once, then the screen is wiped | read of the stages | PASS |
| Real run | stages 1-6 on the VPS, old tokens 401, test-token ✅ twice, symlink + 600 kept | VPS run by the owner, 2026-11-18 | PASS for stages 1-3; stage 4 stopped: `rotate --no-armor` appends the new key (`"old,new"`). Finished by hand (strip old key, test-token ✅, restart ↺0, backup, old-key cleanup per private runbook). Fix: stage 4 strips the old key, test before restart |
| Key-strip sed | `"<64 a>,<64 b>"` becomes `"<64 b>"` | local fake keys file | PASS |
| Issue lifecycle | comment before solve | `rad issue show 0ede5d0` | PENDING |
