---
artifact_type: verification_matrix
task_id: mention-gate
timestamp: 2026-07-03T18:06:27Z
complexity_score: 4
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Plain sentence → no trigger | mentionsUser returns false for text with no bot token | `test/text.test.js`: 'je pense que la grève…' → false | PASS — test green |
| @everyone/@here → no trigger | mentionsUser false for @everyone/@here | `test/text.test.js`: '@everyone…' / '@here…' → false | PASS — test green |
| Reply-to-bot → no trigger | a reply carries no `<@botid>` in content, so mentionsUser false | covered structurally: mentionsUser is content-only; false for any text lacking the token (plain-sentence case) | PASS — by construction (content-only) |
| Genuine @mention → still triggers | mentionsUser true for `<@id>` and `<@!id>` | `test/text.test.js`: 2 true cases | PASS — test green |
| Other-user mention → no trigger | mentionsUser false for a different id | `test/text.test.js`: `<@987…>` vs BOT_ID → false | PASS — test green |
| Substring-id safety | `<@BOTID0>` (longer id) must NOT match BOT_ID (the `>` anchor) | `test/text.test.js`: substring case → false | PASS — test green |
| No crash on empty/undefined | mentionsUser('' / null / undefined) → false, no throw | `test/text.test.js`: 3 asserts | PASS — test green |
| DMs unaffected | isDirectMessage path is independent of the gate change | inspection: line 165 gate is `isMentioned \|\| isDirectMessage`; only isMentioned changed | PASS — inspection |
| Suite + lint + format | npm test green; eslint 0 errors; prettier clean on changed JS | `npm test` / `eslint` / `prettier --check` | PASS — 66/66, 0 errors (4 pre-existing warnings), prettier clean |
| Issue lifecycle documented | Comment before `rad issue state --solved` (patch ID + merge SHA + verification) | `rad issue show f482c08` | PENDING — lands at merge |
