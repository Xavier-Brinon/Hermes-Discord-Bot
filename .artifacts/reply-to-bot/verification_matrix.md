---
artifact_type: verification_matrix
task_id: reply-to-bot
timestamp: 2026-07-03T19:05:16Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Reply-to-bot triggers | isReplyTo true when repliedUser.id === botId | `test/text.test.js`: reply-to-BOT_ID → true | PASS — test green |
| Reply-to-other ignored | isReplyTo false for a different repliedUser id | `test/text.test.js`: repliedUser 987… → false | PASS — test green |
| Non-reply ignored | isReplyTo false when repliedUser null/absent | `test/text.test.js`: null / {} → false | PASS — test green |
| No crash on missing shape | isReplyTo({}, id) and isReplyTo(null, id) → false | `test/text.test.js`: 2 asserts | PASS — test green |
| f482c08 noise fix holds | @everyone/@here/plain/other-user still don't trigger (mentionsUser unchanged; isReplyTo only adds bot-replies) | mentionsUser suite unchanged + isReplyTo other/non-reply false | PASS — 70/70 |
| Gate composition | entrypoint isMentioned = mentionsUser(...) OR isReplyTo(...) | inspection of the gate line | PASS — inspection |
| Suite + lint + format | npm test green; eslint 0 errors; prettier clean on changed JS | `npm test` / `eslint` / `prettier --check` | PASS — 70/70, 0 errors (4 pre-existing warnings), prettier clean |
| Issue lifecycle documented | Comment before `rad issue state --solved` (patch ID + merge SHA + verification) | `rad issue show 92b16a6` | PENDING — lands at merge |
