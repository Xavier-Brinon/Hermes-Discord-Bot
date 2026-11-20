---
artifact_type: simplicity_review
task_id: neutral-hermes-cwd
timestamp: 2026-11-18T19:37:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution
One config constant `HERMES_CWD`, one helper that creates it (`mkdirSync` recursive, 0700) and returns it, `cwd: hermesCwd()` on the two Hermes chat calls, and `writeContextFile` writing into that dir instead of `process.cwd()`.

## Abstinence List (not added, intentional)
- A startup check that the dir is outside any git repo: one `ls` on the VPS answers it once.
- `cwd` on probeHermes: `--version` loads no context.
- `cwd` on yt-dlp / tar / the eval: not agents, no context files.
- A fallback to the old cwd on mkdir failure: would reopen the leak silently.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 15 logical source lines (config + hermes-cli + prompts comment), 40 test lines | 10 source (config 2, hermes-cli 8, prompts 0 net) + 32 test (31 new file, 1 context-refs) | -33% / -20% |

README prose not counted.

## Simplify Triggers (detected)
- None.
