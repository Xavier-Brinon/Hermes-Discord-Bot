---
artifact_type: simplicity_review
task_id: mention-gate
timestamp: 2026-07-03T18:06:27Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution
One pure helper `mentionsUser(content, userId)` = `new RegExp(\`<@!?${userId}>\`).test(content || '')`,
exported from text.js and used in place of `message.mentions.has(client.user.id)` at the
gate. It tests for the bot's typed `<@id>`/`<@!id>` token — the same token the handler
already strips — so @everyone/@here, role pings, and replies-to-the-bot no longer count
as a mention. No options plumbing, no new module, no config.

## Abstinence List (not added, intentional)
- A generic "mention parser" or Discord-utils module — one 1-line predicate is enough
- A reply-continuation feature (respond when a user replies to the bot) — deliberately NOT added; it was the accidental behaviour being removed, and re-adding it is a separate, explicit decision
- Escaping the userId in the regex — Discord snowflake IDs are digits only, so there is nothing to escape; adding escaping would be speculative
- Refactoring the entrypoint mention-STRIP loop to reuse the helper — different concern (strip vs detect over all users); out of scope

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|      4 |      2 |    -2 |

(Production logical LOC: the `mentionsUser` function body + the rewired gate assignment. Comments and the test file are excluded per the logical-LOC rule.)

## Simplify Triggers (detected)
- None
