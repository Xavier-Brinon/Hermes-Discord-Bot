---
artifact_type: verification_matrix
task_id: summary-always-thread
timestamp: 2026-09-25T06:36:44Z
complexity_score: 4
complexity_tier: STANDARD
---

## Complexity Score
Scope 2 (>3 files: text.js, bot, 2 tests, ADR, CONTEXT.md) + Ambiguity 0 (user stated the rule) + Risk 2 (user-facing summary flow) + Knowledge Gap 0 (flow read this session) = **4 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Short summary threads | fits-in-one text in a channel → ONE message in a new thread named as asked | test/text.test.js "postInThread — short text in a channel" | PASS |
| Long summary threads | chunks all land in the new thread | test/text.test.js "postInThread — long text in a channel" | PASS |
| Existing thread reused | cached `message.thread` or fetched by message id; never a 2nd startThread | test/text.test.js (cached, uncached) | PASS |
| Thread / DM in place | no new thread; one message there | test/text.test.js "in a thread or a DM" | PASS |
| sendLongResponse unchanged | 4 existing sendLongResponse tests still green | npm test | PASS — 130/130 (+5) |
| Lint / format | eslint 0, prettier clean | `npx eslint .`; `npx prettier --check .` | PASS |
| Live: 📝 short summary in a channel | thread opens on the link message, summary + ❓ inside, channel shows only the link | Discord, after deploy | PENDING — live |
| Live: follow-up in the thread | @mention in the thread answers about the article | Discord, after deploy | PENDING — live |
| Issue lifecycle documented | comment before `rad issue state --solved` | `rad issue show f16ff0f` | PENDING — lands at merge |
