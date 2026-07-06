# CONTEXT — Domain glossary

A tight, opinionated glossary of terms unique to *this* project's domain. This is
**domain** language, distinct from the framework's **process** language in
`waysofworking.org`. Keep it small; add a term only when its absence would cause
a misread.

| Term | Meaning in this project |
|---|---|
| **Hermes** | The Hermes Agent **CLI binary** (`HERMES_BIN`) the bot shells out to via `execFile`. The bot is a wrapper around it, not an API client. |
| **Le Mistral Bot** | The deployed Discord bot identity (`Le Mistral Bot#9470`). "The bot" throughout the docs. |
| **Allowed guild** | The single Discord server the bot serves (`ALLOWED_GUILD_ID`). Messages from any other guild are silently ignored. Startup fails hard if this is unset. |
| **Admin** | The Discord user (`ADMIN_USER_ID`) who receives error DMs. Distinct from "user" — the admin operates the bot; users talk to it. |
| **Session** | A Hermes conversation thread, identified by a `session_id` parsed from Hermes stdout and cached per channel/thread (`.session_cache.json`) to give follow-up continuity. |
| **Recap** | A theme-list summary of a channel's recent activity over a parsed timeframe ("mois de mai", "la semaine dernière", "3 jours"), posted in a thread. |
| **Theme** | One `THEME:`-prefixed line Hermes emits for a recap; the bot parses these into a bulleted thread. |
| **Link summary** | The structured summary the bot posts when an **article** URL is detected — an intro line, then adaptive **Thèse centrale**/**Idée principale**, **Arguments clés**/**Points clés**, and **Questions** (see `buildSummaryFormat` in `prompts.js`). The same format is applied when a link is **@mentioned** to the bot. Non-article URLs (video/image/social/music, per `NON_ARTICLE_PATTERN`) are skipped silently. |
| **Banner parsing** | Extracting the answer from Hermes' terminal output by locating the `⚕ Hermes` banner and the closing `──` rule. The bot's most fragile coupling to the CLI. |
| **The harness** | The VPS supervision stack: **PM2** (process manager — auto-restarts the bot on crash) + **dotenvx** (decrypts `.env` at launch). Lives in `/data/workspace` (managed Docker sandbox). A container restart/recreate needs a manual `./manage_hermes.sh start` — no boot hook is available. |
| **dotenvx** | The tool that keeps an **encrypted** `.env` committable while the decryption key (`.env.keys`) stays out of git. Required at *runtime* to boot the bot. |
