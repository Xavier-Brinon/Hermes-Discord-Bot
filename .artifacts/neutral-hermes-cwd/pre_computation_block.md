---
artifact_type: pre_computation_block
task_id: neutral-hermes-cwd
timestamp: 2026-11-18T19:37:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | Hermes injects AGENTS.md from every directory between the git root and its cwd, so a subdirectory of the repo would still load the repo's AGENTS.md. A directory outside the checkout is required. | HIGH |
| 2   | Without a git root above the cwd, Hermes checks the cwd only (no parent walk for AGENTS.md / .hermes.md). | HIGH |
| 3   | SOUL.md and memory come from `$HERMES_HOME` / the profile, not the cwd, so the persona survives. | HIGH |
| 4   | Hermes resolves `@file:` against its cwd (allowed_root), so the recap offload works if the temp file is written into the new cwd. | HIGH |
| 5   | `/data` on the VPS is not a git checkout and holds no AGENTS.md / CLAUDE.md / .cursorrules, so `/data/hermes-cwd` is neutral. | MEDIUM (one `ls -A /data` on the VPS) |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | read `~/.hermes/hermes-agent/agent/prompt_builder.py` `_agents_md_directory_chain` | chain from git root to cwd | "git root first, cwd last; cwd only without a root" | 2026-11-18T19:30:00Z | PASS |
| 2   | same function, no-root branch | cwd only | cwd only | 2026-11-18T19:30:00Z | PASS |
| 3   | issue 8f33078 history + Hermes profile layout | SOUL.md under the profile | SOUL.md in `/data/profiles/discord-bot-021` | 2026-11-18T19:30:00Z | PASS |
| 4   | `hermes-cli.js` writeContextFile comment + issue 1f154fc | file must sit under Hermes's cwd | confirmed | 2026-11-18T19:30:00Z | PASS |
| 5   | `ls -A /data` on the VPS | no `.git` or context files | not run | — | PENDING |

## Scope Declaration

### Files in scope
- `config.js`: `HERMES_CWD` (env-overridable, default `<parent of WORKSPACE_DIR>/hermes-cwd` = `/data/hermes-cwd`).
- `hermes-cli.js`: create the dir, pass `cwd` to the askHermes and runLinkSummary calls, write the recap context file there.
- `test/hermes-cwd.test.js` (new): fake Hermes binary proves the cwd and the offload file location.
- `prompts.js`: one stale comment ("under its cwd /data/workspace").
- `README.md`: §Secrets paragraph that says Hermes runs in `/data/workspace`.

### Files off-limits
- `child-env.js`, `hermes-discord-bot-clean.js`, `manage_hermes.sh`, `.env`.
- `evals/run-recap-eval.js`: dev-only eval, noted as orthogonal.

## Interpretations of the request
- "Neutral cwd" = a directory outside any git checkout that holds no context files; the bot creates it (mode 0700) when it is missing.

## Alternatives considered
- `--ignore-rules`: drops SOUL.md too, rejected in 8f33078.
- A subdirectory of `/data/workspace`: still under the repo's git root, so AGENTS.md is loaded (assumption 1).
- `os.tmpdir()`: neutral too, but shared with other processes; a dedicated dir keeps the `@file:` root empty apart from the bot's own temp files.
- Fall back to the old cwd when mkdir fails: silently reopens the leak. A failed mkdir fails the call instead.
