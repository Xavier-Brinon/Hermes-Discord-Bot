# Hermes Discord Bot — Governing Design Doc

> The project's perpetual identity statement: *what* it is for, *who* it serves,
> and *what success looks like*. Depth lives in the artifacts referenced here
> (`README.md`, `CLAUDE.md`, Radicle issues), not inlined.

## What

A French-language Discord assistant for a single community server ("Le Mistral"),
powered by the **Hermes Agent CLI**. The bot does three things:

- **Answers** `@mentions` and DMs in French, with conversation continuity across
  follow-ups (Hermes sessions, cached per channel/thread).
- **Summarises** article links posted in channels — a structured summary with an
  adaptive **Thèse centrale**/**Idée principale**, **Arguments clés**, and
  **Questions** (see `buildSummaryFormat`); the same shape when a link is
  @mentioned. Non-article URLs (video/image/social/music) are skipped.
- **Recaps** channel activity over a requested timeframe as a list of themes,
  posted in a thread.

It is a thin **CLI-wrapper**: it shells out to the `hermes` binary and parses its
terminal output, rather than calling a hosted API.

## Who

- **Members of the one allowed Discord guild** (`ALLOWED_GUILD_ID`) — French
  speakers in the Le Mistral community. The bot silently ignores every other
  server.
- **The admin** (`ADMIN_USER_ID`) — receives rich error DMs when a Hermes call
  fails, so end users see clean messages while the operator gets the stack.

> Assumption to confirm: "Le Mistral" is the target community and French is the
> sole user-facing language. Correct here if the audience is broader.

## Success

- The bot is **online and self-healing** on the VPS (PM2 + watchdog), surviving
  crashes and reboots without manual intervention.
- Replies are **exclusively in French**, useful, and arrive within the Hermes
  timeout; long answers split cleanly into threads.
- Failures are **invisible to users and visible to the admin** — never a raw
  stack trace in a channel.
- The bot stays **scoped to the one server** and never leaks secrets (dotenvx).

## See also

- `README.md` — operational runbook (start/stop/watchdog/troubleshooting).
- `CLAUDE.md` — architecture, conventions, Radicle workflow, `@YackShavingSkill`
  master rules.
- `CONTEXT.md` — domain glossary.
- Radicle issues (`rad:z3RBfCqurRiwaVhYKkSwkUYdgkkgb`) — the tracked backlog.
