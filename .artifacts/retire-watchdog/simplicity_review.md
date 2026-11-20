---
artifact_type: simplicity_review
task_id: retire-watchdog
timestamp: 2026-07-06T12:56:35Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Pure subtraction. Delete the two ops scripts (`hermes_watchdog.sh`, `start_after_reboot.sh`),
point recovery at the pre-existing `./manage_hermes.sh start`, and rewrite the two README
recovery sections + the CONTEXT glossary line to describe the honest model: PM2 restarts the bot
on crash; a container restart/recreate needs one manual command because the managed sandbox has
no boot hook we control. No new code, no new script, no config knob.

## Abstinence List (not added, intentional)
- A `resurrect` subcommand on `manage_hermes.sh` — `start` already recovers fully and is more robust than resurrecting a possibly-stale dump; a new verb is unneeded surface.
- A `pm2 resurrect` boot script — nothing in the sandbox would invoke it at boot; it would be dead code.
- A systemd/upstart unit — no init system runs (PID 1 is tini); units outside `/data` are wiped on recreate.
- `pm2 install pm2-logrotate` — disk is at 12%, logs ~2 MB; not this task (out of scope, low value).
- Any change to the entrypoint `/app/u4s-hermes-agent` — image-baked, host-side, unmodifiable.
- Reformatting the pre-existing prettier-dirty README/CONTEXT — a whole-file drive-by; left as-is (orthogonal).

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      0 |      0 |     0 |

## Simplify Triggers (detected)
- None. Zero new logical LOC added — the change is 68 lines of bash DELETED plus prose in README.md/CONTEXT.md (documentation is excluded from the logical-LOC budget per schemas/artifacts.md §Line-Count Budget). This is the Simplicity-First ideal: the best fix removed code and machinery rather than adding any. Mirrors `examples/patterns/surgical-diff.md` — only the files the decision needs are touched; the stale `NON_ARTICLE_PATTERN` reference noticed in CONTEXT.md line 17 is left for its own change.
