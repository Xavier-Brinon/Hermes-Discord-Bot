---
artifact_type: simplicity_review
task_id: rotate-secrets-wizard
timestamp: 2026-11-18T17:56:47Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
The `/wizard` template with six stages: pre-flight, Discord token, retired token, keypair, backup, old-key copies. Values go through `dotenvx set`/`rotate`; the only extra helper is a one-line Discord status check.

## Abstinence List (not added, intentional)
- The library's `write_env` (it writes plaintext); `ENV_FILE=/dev/null` stops `ask_secret` offering ciphertext as a default.
- Resume/state file for partial runs: a re-run after stage 2 just needs another reset, documented in the header.
- Automated tests: every stage needs a live Discord token or the VPS layout.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 150 logical lines below the STAGES marker (vendored library and README not counted) | 154 (after the stage 4 append fix) | +3% |

## Simplify Triggers (detected)
- None.
