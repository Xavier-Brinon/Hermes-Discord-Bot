---
artifact_type: pre_computation_block
task_id: dm-admin-gate
timestamp: 2026-11-18T14:00:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions

| #   | Assumption | Confidence |
| --- | ---------- | ---------- |
| 1   | With no `-t`, Hermes resolves the toolset via `coding_selection()` (coding posture in a code workspace, terminal + file + browser) else the platform default; both include `terminal`. The bot's cwd `/data/workspace` is a git checkout. | HIGH |
| 2   | `-t web` enables exactly `web_search` + `web_extract`. | HIGH |
| 3   | `@file:` context (recap offload, issue 1f154fc) is expanded before the model runs, not through the `file` toolset, so pinning `-t web` does not break large recaps. | HIGH |
| 4   | `-t web` placed after `chat` is accepted together with `--resume` before `chat`; the link flow already uses `chat … -t web`. | HIGH |
| 5   | The 📝 reaction flow is already closed to DMs (guild check at the reaction handler). | HIGH |
| 6   | Prod runs Hermes 0.22, local source is 0.21.5; the toolset resolution is the same in both. | MEDIUM |

## Verifications

| #   | command | expected | actual | timestamp | verdict |
| --- | ------- | -------- | ------ | --------- | ------- |
| 1   | read `~/.hermes/hermes-agent/cli.py::_build_cli_from_args` | empty toolsets fall back to coding posture / platform tools | `elif not toolsets: coding_selection(...)` else `_get_platform_tools(CLI_CONFIG, "cli")` | 2026-11-18T13:40:00Z | PASS |
| 2   | read `toolsets.py` TOOLSETS["web"] | web_search, web_extract | `_ts(..., ["web_search", "web_extract"])` | 2026-11-18T13:40:00Z | PASS |
| 3   | `grep -rln '@file:' agent/` | expander module, not a tool | `agent/context_references.py` | 2026-11-18T13:45:00Z | PASS |
| 4   | `sed -n 185,215p hermes-cli.js` | link flow passes `chat -q … -t web` | `'chat', '-q', prompt, '-t', 'web', '-Q', …` | 2026-11-18T13:45:00Z | PASS |
| 5   | `grep -n messageReactionAdd -A25 hermes-discord-bot-clean.js` | guild-only guard | `if (!message.guild \|\| message.guild.id !== ALLOWED_GUILD_ID) return;` | 2026-11-18T13:45:00Z | PASS |

## Scope Declaration

### Files in scope
- `text.js` — pure `isAdmin(authorId, adminId)` gate, fail closed.
- `hermes-discord-bot-clean.js` — ignore DMs from non-admins at the server-restriction block.
- `hermes-cli.js` — pure `buildAskArgs(prompt, sessionId)` that always pins `-t web`; askHermes uses it.
- `test/text.test.js` — gate tests.
- `test/hermes-cli.test.js` — args tests (toolset always present, resume placement).
- `hermes-discord-bot.md` — "DMs" becomes "DMs from the admin".

### Files off-limits
- `config.js` — `ADMIN_USER_ID` already exported; no new constant.
- `prompts.js` — no prompt change.
- Hermes profile `discord-bot-021` on the VPS — config change is not needed once `-t` is explicit; the live audit is a verification step, not an edit.

## Interpretations of the request
- "Restrict DMs to admin" = ignore silently, no French refusal message (issue: "Others are ignored silently").
- "Pin Q&A to an explicit minimal toolset" = every askHermes call (Q&A, resume, recap), not only the no-link path. User chose `-t web` everywhere (2026-11-18).

## Alternatives considered
- Guild-member DMs — rejected by user: needs a member fetch per DM and keeps a wider surface.
- `-t search` for non-web calls — rejected by user: plain questions could no longer read a page.
- Remove `terminal`/`file` in the profile config — rejected: the profile can drift (it already did with 0.22); an argv pin is in the repo and tested.
- No-tools run (`-t ""`) — not possible: an empty value falls back to the default resolver.
