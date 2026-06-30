---
artifact_type: change_boundary
task_id: test-pure-helpers
timestamp: 2026-06-30T06:16:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | New module: unwrapText, splitAtBoundaries, isNonArticleUrl (verbatim moves + 1-line wrapper) | create |
| `recap.js` | New module: pure parseTimeframe(content, now) lifted from the inline recap block | create |
| `test/text.test.js` | Unit tests for the text helpers + edge cases | create |
| `test/recap.test.js` | Unit tests for parseTimeframe against a fixed now | create |
| `eslint.config.js` | Flat eslint config (recommended + node globals) | create |
| `.prettierrc` | Prettier config | create |
| `package.json` | Add eslint/prettier devDeps + lint/format scripts | modify |
| `hermes-discord-bot-clean.js` | Import from text.js/recap.js; delete inline defs; replace inline timeframe block with parseTimeframe | modify |
| .artifacts/test-pure-helpers/pre_computation_block.md | Skill A artifact | create |
| .artifacts/test-pure-helpers/simplicity_review.md | Skill B artifact | create |
| .artifacts/test-pure-helpers/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/test-pure-helpers/verification_matrix.md | Skill D artifact | create |
| .artifacts/test-pure-helpers/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Append Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup after adherence report lands | modify |
| package-lock.json | Created/updated by `npm install` of the devDeps | create |

## Out-of-Bound List
- prompts.js — its own tested module; unrelated concern
- askHermes / summarizeLink — owned by recap-context-file; unchanged
- config / hermes / cache module extraction — issue 950dc54 (next task)
- manage_hermes.sh, README.md, CLAUDE.md, evals/ — no run/ops/doc/eval change
- the rest of the recap handler (fetchChannelHistory calls, <10-msg extend, header date strings) — stays in the bot; only the pure date-math is lifted

## Creation Order (if ordering matters)
1. text.js + recap.js — must exist before the bot's `require(...)` resolves
2. `npm install` (eslint/prettier devDeps) — must run before `npm run lint` works

## Orthogonal Issues (noticed, skipped)
- The 893-line entrypoint still mixes config/hermes/cache concerns — that is exactly 950dc54, done next
- Running eslint on the legacy bot will likely surface pre-existing findings (unused vars, etc.) — not this task's cleanup; eslint is configured to surface (warn), not gate
- `test-token.js` is a manual utility, not a test — left as-is (the issue only notes it; no action required)

## Orphan Tracking
- The bot's inline `unwrapText`, `splitAtBoundaries`, `NON_ARTICLE_PATTERN`, and the inline timeframe block become unused once imports replace them — all removed in this commit (no dangling copies)
- `DISCORD_MSG_LIMIT` stays in the bot (used by sendLongResponse); `splitAtBoundaries` takes maxLen as an arg so it does not need the const — keep the const in the bot
