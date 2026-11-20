---
artifact_type: change_boundary
task_id: d583385-prettierignore
timestamp: 2026-07-08T06:28:26Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `.prettierignore` | Shield append-only records + vendored framework + tool config from `prettier --write .` | create |
| `config.js` | Our source, drifted → format | modify (format only) |
| `recap.js` | Our source, drifted → format | modify (format only) |
| `test-token.js` | Our source, drifted → format | modify (format only) |
| `test/modules.test.js` | Our test, drifted → format | modify (format only) |
| `test/recap.test.js` | Our test, drifted → format | modify (format only) |
| `evals/run-recap-eval.js` | Our eval harness, drifted → format | modify (format only) |
| `evals/README.md` | Our eval doc, drifted → format | modify (format only) |
| `README.md` | Our doc, drifted → format (user-approved) | modify (format only) |
| `CONTEXT.md` | Our doc, drifted → format (user-approved) | modify (format only) |
| `CLAUDE.md` | Our doc, drifted → format (user-approved) | modify (format only) |
| `hermes-discord-bot.md` | Our doc, drifted → format (user-approved) | modify (format only) |
| `.artifacts/d583385-prettierignore/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/d583385-prettierignore/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/d583385-prettierignore/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/d583385-prettierignore/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/d583385-prettierignore/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal (append-only; now Prettier-ignored) | modify (append) |
| `METRICS.md` | Regenerated rollup (now Prettier-ignored) | modify (regen) |

## Out-of-Bound List
- `.artifacts/**` (all prior task records) — append-only; formatting corrupts the trail. → `.prettierignore`.
- `skills/`, `examples/`, `templates/`, `schemas/`, `tools/` — vendored `@YackShavingSkill` framework. → `.prettierignore`.
- `.serena/` — Serena-MCP tool config. → `.prettierignore`.
- `hermes-discord-bot-clean.js`, `hermes-cli.js`, `cache.js`, `prompts.js`, `text.js`, `evals/assertions.js` — already Prettier-clean; no touch.
- All `.js`/`.md` **logic and prose** — this is a whitespace/table/quote-only pass; no semantic edits.

## Orthogonal Issues (noticed, skipped)
- `.serena/project.yml` drift suggests `.serena/` may be untracked or should be gitignored — separate hygiene concern; `.prettierignore` is enough to stop format churn here.
- No pre-commit auto-format hook exists, so files will re-drift over time — that's setup-pre-commit's job, not this ticket.

## Orphan Tracking
- None. `.prettierignore` is consumed by Prettier's CLI/`npm run format`; every formatted file already existed. No symbols added or removed.
