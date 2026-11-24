# Hermes Discord Bot — Le Mistral Bot

French-language Discord bot powered by the Hermes Agent CLI. Answers `@mentions`
and DMs in French, summarises links on a 📝 reaction, and produces channel recaps.

This repo adopts the **`@YackShavingSkill`** framework (vendored locally:
`skills/ examples/ templates/ tools/ schemas/`). The framework master rules are
in the **`@YackShavingSkill — Master Rules`** section below; its process
vocabulary is in the shared ways of working (see Reference). Read this whole
file first, then follow links on demand.

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

Deployment harness on the VPS (`/data/workspace`): **PM2** supervises the bot
as a single process and restarts it on crash, a **gateway hook** in
`/data/hooks/` restarts it when the container is recreated, and **dotenvx**
decrypts secrets at launch. There is no bash watchdog. The bot must run as
exactly **one** process (see `README.md` §Watch points). See `README.md` for the
operational runbook.

## Conventions

- **All Discord-facing bot text is in French** (replies, link summaries,
  recaps). Keep it that way. This governs the bot's output, not developer docs.
- **Use `execFile`, never `exec`,** for the Hermes CLI — no shell means no command
  injection from user prompts.
- **Secrets only via dotenvx.** Never commit `.env.keys`. Add/rotate vars with
  `npx dotenvx set NAME "value"`.

## Issue tracking (this project's tracker binding)

The backlog is **one Org file per ticket** in **`docs/private/tickets/`**,
gitignored. Code is plain git, hosted on GitHub. The **`emacs-ops`** skill
operates the tickets; the rules it applies live in the shared ways of working:
`~/Documents/Projects/Ways-of-working/ways-of-working/backlogs-tickets-and-issues.org`
(titles, kind tags, Trackers, spikes, postmortems),
`triage.org` (the three scores) and `branches-commits-and-merging.org` (branch,
review, merge, `Closes`). Why: `docs/adr/0003-issues-in-a-private-org-file.org`
and its amendment. Issues closed before 2026-11-20 stay in the local Radicle
archive (`rad issue show <id>`); a ticket migrated from an issue says
"Formerly issue =<id>=", so old references in commits still resolve.

**Every change starts as a ticket**, even one-liners. The flow is:

```
ticket → branch → self-review → merge → close
```

1. **Open**: a file `<identifier>--<slug>__<tags>.org` (Denote naming; the
   identifier is the creation time, `date +%Y%m%dT%H%M%S`), holding one
   top-level heading with the triage properties. Copy the header of an existing
   ticket. A ticket that belongs to a Tracker carries `:TRACKER: <identifier>`
   and an entry in the Tracker's checklist.
2. **Start**: branch off `main` named after the slug; set the heading to
   `INPROG`.
3. **Review**: set `REVIEW`, read `git diff main...HEAD` in full. Self-review
   counts as review for a solo repo.
4. **Close commit**: its body records how the work was reviewed, each
   acceptance criterion's outcome, the build/lint/test results, a `Learned:`
   paragraph, and a last line `Closes <identifier>`.
5. **Merge** with `git merge --ff-only`, delete the branch, then **delete the
   ticket file** and tick its Tracker entry. There is no archive: git keeps the
   record. A won't-do ticket is set to `CANCELLED` and deleted the same way;
   say why to the user first.

States: `TODO`, `NEXT`, `INPROG`, `REVIEW`, then `DONE` or `CANCELLED`.
List the open tickets with `rg -m1 '^[*] ' docs/private/tickets`.

### Editing tickets

- **One writer at a time.** Change an existing ticket with exact-string edits.
  The user may have it open in Emacs: name the files you changed.
- **Never commit a ticket** and never copy its text to GitHub without the
  user's word-for-word approval (`emacs-ops` §Promoting): tickets are private
  and hold security findings.
- Keep body lines out of column 0 when they start with `*` (a heading), and
  comma-escape any line starting with `#+`.

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

This commit convention composes with the issue workflow above: the commit lands
on the issue's branch and its message carries the lifecycle record.

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
- **Ways of working:** `~/Documents/Projects/Ways-of-working/ways-of-working.org`,
  shared by every repo; its index says which section to read for each task,
  the framework's process vocabulary included.
- **Complexity rubric and worked examples:** `skills/orchestrator.md`
- **Pre/Post-Flight format:** `templates/session_journal.md`
- **Operational runbook:** `README.md`
