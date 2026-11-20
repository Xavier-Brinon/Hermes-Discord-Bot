---
artifact_type: change_boundary
task_id: dm-admin-gate
timestamp: 2026-11-18T14:00:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `text.js` | `isAdmin` gate | modify |
| `hermes-discord-bot-clean.js` | ignore non-admin DMs | modify |
| `hermes-cli.js` | `buildAskArgs`, always `-t web` | modify |
| `test/text.test.js` | gate tests | modify |
| `test/hermes-cli.test.js` | args tests | modify |
| `hermes-discord-bot.md` | DMs are admin-only | modify |
| `evals/run-recap-eval.js` | pin `-t web` to stay at parity with the bot's recap call (added at Expert Review, 2026-11-18) | modify |

## Out-of-Bound List
- `config.js` — no new constant.
- `prompts.js` — no prompt change.
- `README.md` — no runbook step changes.

## Orthogonal Issues (noticed, skipped)
- `hermes-cli.js` comment "insert -t web after chat" was wrong: the splice put `-t web` before `chat`. Removed with the refactor, no separate issue.
- SSRF via `web_extract` stays open: issue 7102348.
- Child env passes `DISCORD_BOT_TOKEN` to Hermes: issue 03dee16.

## Orphan Tracking
- None.
