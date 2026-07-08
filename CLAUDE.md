# Hermes Discord Bot — Le Mistral Bot

French-language Discord bot powered by the Hermes Agent CLI. Answers `@mentions`
and DMs in French, summarises links on a 📝 reaction, and produces channel recaps.

This repo adopts the **`@YackShavingSkill`** framework (vendored locally:
`skills/ examples/ templates/ tools/ schemas/`). The framework master rules are
in the **`@YackShavingSkill — Master Rules`** section below; its process
vocabulary is in `waysofworking.org`. Read this whole file first, then follow
links on demand.

---

## What this is (architecture)

- **Single entrypoint:** `hermes-discord-bot-clean.js` (discord.js v14).
- **CLI-wrapper, not an API client.** The bot talks to Hermes by shelling out to
  the `hermes` binary with `execFile` in **`-Q` programmatic mode** and parsing
  its final-response output via `parseHermesOutput`. Any change to that `-Q`
  output format can break answer extraction — treat the parser as a coupling point.
- **Three message flows:** (1) `@mention`/DM Q&A, (2) channel recap → theme list
  in a thread, (3) opt-in link summary when a user reacts 📝 to a message with a link.
- **State on disk:** a link cache and a session cache (for conversation
  continuity) persisted under the workspace dir.

## Running

| Context          | Command                                                         |
| ---------------- | --------------------------------------------------------------- |
| Local / dev      | `npm start`                                                     |
| VPS (canonical)  | `./manage_hermes.sh {start\|stop\|restart\|status\|logs}`       |
| VPS (npm equiv.) | `npm run pm2:start` / `pm2:restart` / `pm2:status` / `pm2:logs` |

Deployment harness on the VPS (`/data/workspace`): **PM2** supervises the bot, a
bash **watchdog** re-checks PM2 every 60 s, and **dotenvx** decrypts secrets at
launch. See `README.md` for the operational runbook.

## Conventions

- **All Discord-facing bot text is in French** (replies, link summaries,
  recaps). Keep it that way. This governs the bot's output, not developer docs.
- **Use `execFile`, never `exec`,** for the Hermes CLI — no shell means no command
  injection from user prompts.
- **Secrets only via dotenvx.** Never commit `.env.keys`. Add/rotate vars with
  `npx dotenvx set NAME "value"`.

## Radicle ways of working (this project's forge skill)

This repo uses **Radicle** (`rad:z3RBfCqurRiwaVhYKkSwkUYdgkkgb`) as the source of
truth for issues and code review. GitHub is a mirror; Radicle is canonical. This
section is the concrete forge binding for the tracker-neutral issue lifecycle
described in `waysofworking.org` §Issue tracking and lifecycle.

**Every change starts as a `rad issue`** — even one-liners. The flow is:

```
issue → branch → rad patch → review → merge → solve issue
```

1. **Open an issue** with triage labels (see below). One concern per issue, so it
   stays independently grabbable.
2. **Branch** off `main` named after the issue (e.g. `issue/dotenvx-runtime-dep`).
3. **Propose a `rad patch`** instead of pushing to `main`. Self-review counts as
   review for a solo repo, but the patch object records the diff and discussion.
4. **Lifecycle comment, then state change.** Before any `rad issue state`, post a
   `rad issue comment` recording: patch ID + HEAD SHA, how it was reviewed, how it
   was merged, build/lint/test outcome, and the `Fix N closes <issue>` line. A
   bare state change with no comment is an incomplete record.
5. **Close** with `--solved` (done/merged) or `--closed` (won't do / superseded).

### Triage labels (required on every new issue)

| Label           | Range  | Meaning                                                                      |
| --------------- | ------ | ---------------------------------------------------------------------------- |
| `effort:N`      | 1–10   | Brute-force coding cost (1 = minutes, 10 = multi-day grind)                  |
| `complexity:N`  | 1–10   | Codebase + domain knowledge required (1 = beginner, 10 = expert)             |
| `confidence:N%` | 0–100% | "Do I know what I'm doing?" (0% = investigation, 100% = done it in my sleep) |

### `rad` CLI gotchas (read before filing)

- **One label per `--labels` flag.** `--labels "a,b,c"` creates a single literal
  label `a,b,c`; you want `--labels a --labels b --labels c`. Verify with
  `rad issue list` (correct = space after comma).
- **Title ≤ 100 characters** or it gets truncated everywhere.
- **`rad issue list` shows open only** — use `--all` for the full picture.
  `rad issue show <id>` → `Status` is the only reliable state read.
- **Close reasons differ:** `--solved` = done/merged; `--closed` = won't do.
- **COBs are CRDTs** — issue/label/state calls can run in parallel without
  conflict. Low "Synced with N seed(s)" counts are normal, not failures.

---

# @YackShavingSkill — Master Rules

Adhere to the `@YackShavingSkill` framework on every substantive code task in
this repository. Trivial conversational replies and the bootstrap/adoption of
the framework itself are exempt; framework discipline applies to consequential
code and architecture changes.

> **Agent binding.** The framework was authored for the Pi multi-agent
> lifecycle. Claude Code (and other non-Pi agents) run the **same** protocol,
> but obtain **explicit user confirmation** at the COMPLEX tier before coding,
> per `skills/orchestrator.md`.

## 3-Layer Defense (summary)

1. **Protocol** — complexity-scored, skill-driven execution. See
   `skills/orchestrator.md`.
2. **Context** — cite a Gold Standard pattern before writing code. See
   `examples/patterns/`.
3. **Reflection** — write a Pre-Flight entry before coding and a Post-Flight
   entry after. See `templates/session_journal.md`.

## Quick-reference: Complexity → Skills

| Raw sum | Tier     | Skills activated              |
| ------- | -------- | ----------------------------- |
| 0 – 2   | TRIVIAL  | D                             |
| 3 – 5   | STANDARD | A + B + C + D                 |
| 6 – 8   | COMPLEX  | A + B + C + D + Expert Review |

Scoring rubric and worked examples: `skills/orchestrator.md`.

## Skills

| Letter | Name                  | File                   | Fires when                        |
| ------ | --------------------- | ---------------------- | --------------------------------- |
| A      | Think Before Coding   | `skills/think.md`      | `tier ≥ STANDARD`                 |
| B      | Simplicity First      | `skills/simplicity.md` | `tier ≥ STANDARD`                 |
| C      | Surgical Changes      | `skills/surgical.md`   | any task modifying existing files |
| D      | Goal-Driven Execution | `skills/goal.md`       | ALL tasks (minimal for TRIVIAL)   |

## Mandatory Workflow

1. Read `skills/orchestrator.md`. Compute the score. Determine the tier.
2. If `SESSION_LOG.md` does not exist, create it from
   `templates/session_journal.md`. If it already exists, append a new
   `# Task:` section to the bottom — never overwrite the file.
3. Open each activated Skill file and follow its instructions.
4. Append the Pre-Flight entry under the current task's heading in
   `SESSION_LOG.md` — cite a gold standard from `examples/patterns/` by
   relative path.
5. Produce every required artifact per `schemas/artifacts.md`. Save them
   under `.artifacts/{task_id}/`.
6. Write the code.
7. Append the Post-Flight entry under the current task's heading in
   `SESSION_LOG.md`. Re-open the Verification Matrix and fill in the
   PASS/FAIL outcomes.
8. Hand off to the Review Gate. The Reviewer reads `skills/review.md` and runs
   `tools/review/lint-frontmatter.sh` followed by
   `tools/review/scope-adherence.sh <task_id> [--commit <sha>] [--emit]` to emit
   an Adherence Report at `.artifacts/{task_id}/adherence_report.md`; once the
   report lands, `tools/review/aggregate-metrics.sh` rolls every
   `.artifacts/*/adherence_report.md` into `METRICS.md` at the repo root. For
   COMPLEX-tier tasks, the Expert Reviewer protocol at `skills/review-expert.md`
   applies (cross-task history, umbrella reconciliation, architectural drift),
   each emitting warnings, never Instant Fails.

## Commit convention

The canonical pattern is a **single atomic commit** shipping the target edits +
all four STANDARD artifacts + the self-attested `adherence_report.md` +
regenerated `METRICS.md` together, with a post-commit
`tools/review/scope-adherence.sh <task_id> --commit <sha>` run to verify the
self-attested metrics match the tool-computed state.

This commit convention composes with the Radicle workflow above: the commit
lands on the issue's branch, the lifecycle comment references its SHA, and the
patch carries the diff.

## Enforcement

- The Verification Gate reads `SESSION_LOG.md` **before** it looks at the diff.
  Mismatch between Pre-Flight commitments and Post-Flight outcomes = **Instant
  Fail**.
- Violating the Line-Count Budget (Skill B) by more than 25% without a recorded
  Simplify Trigger = Instant Fail.
- Touching a file in the Out-of-Bound List (Skill C) = Scope Bleed, logged in the
  Adherence Report.

## Reference

- **Artifact schemas:** `schemas/artifacts.md`
- **Process vocabulary:** `waysofworking.org`
- **Complexity rubric and worked examples:** `skills/orchestrator.md`
- **Pre/Post-Flight format:** `templates/session_journal.md`
- **Operational runbook:** `README.md`
