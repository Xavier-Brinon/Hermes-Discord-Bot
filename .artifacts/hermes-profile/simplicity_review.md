---
artifact_type: simplicity_review
task_id: hermes-profile
timestamp: 2026-09-25T07:32:34Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
One env-overridable constant in the `HERMES_BIN` shape, substituted at the three `-p` sites; the cutover is two `.env` values plus clearing the session cache.

## Abstinence List (not added, intentional)
- Startup check that the profile exists — the unmerged 9afaeac probe is the place for startup diagnostics.
- Per-flow profiles (recap vs Q&A vs 📝) — one profile per bot.
- Auto-clearing `.session_cache.json` on a profile change — a manual runbook step for a once-a-year event.
- Editing the live profile — rollback would stop being a `.env` flip.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 70     | 76     | +9%   |

Budget fixed at Post-Flight, not Pre-Flight (process miss, recorded). Actual: code +10 net (config 4, hermes-cli 1, eval 5), test +18, README runbook +35, evals/README +1.

## Anti-Pattern contrasted
`examples/anti-patterns/kitchen-sink-scaffold.md` — no profile registry or auto-detection for a two-variable switch.

## Simplify Triggers (detected)
None fired.
