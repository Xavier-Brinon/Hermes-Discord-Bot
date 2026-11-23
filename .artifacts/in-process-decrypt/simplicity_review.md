---
artifact_type: simplicity_review
task_id: in-process-decrypt
timestamp: 2026-11-18T15:19:53Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
One `loadEnv()` that calls dotenvx `config({ path: <repo>/.env, strict: true })`, called first in the entrypoint and in test-token.js, and launch commands without `dotenvx run`.

## Abstinence List (not added, intentional)
- PM2 ecosystem file / `filter_env`.
- Scrubbing secrets from process.env after login (does not change /proc/<pid>/environ).
- Log redaction helper: no log line prints a secret today; verified by grep after deploy.
- Removing the `dotenv` dependency (lockfile churn).

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 60 (source 20, tests 40), docs not counted | 61 (source 16, tests 45) | +2% |

## Simplify Triggers (detected)
- Key location: the explicit off-workspace `.env.keys` path planned after the 6fe5a3e incident was dropped. dotenvx reads and writes through a symlink (fsx uses writeFileSync, never unlink/rename), so the stopgap symlink is the permanent layout and load-env.js needs no path option or `-fk` flags.
