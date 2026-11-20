---
artifact_type: simplicity_review
task_id: child-env-allowlist
timestamp: 2026-11-18T13:56:45Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
One pure function `childEnv(env = process.env)` that keeps a fixed set of names plus `LC_*`, and `env: childEnv()` added to each of the six execFile option objects.

## Abstinence List (not added, intentional)
- Per-child allowlists (Hermes vs yt-dlp vs tar): one list covers all three, none of its entries is secret.
- An env var to extend the allowlist at runtime: would let a launcher re-open the leak.
- A wrapper around execFile: six call sites, one option each.
- Redaction of logs: belongs to e39e496.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| none set before coding | 40 source + 66 tests | n/a |

Logical lines (non-blank, non-comment): `child-env.js` 31, wiring 9 (the probeHermes call reflow by prettier is not counted), `test/child-env.test.js` 66. No budget was recorded before coding; see the Post-Flight Reflex Audit.

## Simplify Triggers (detected)
- None.
