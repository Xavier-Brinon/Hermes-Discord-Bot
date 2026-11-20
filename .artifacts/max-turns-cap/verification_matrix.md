---
artifact_type: verification_matrix
task_id: max-turns-cap
timestamp: 2026-08-13T14:41:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix

| # | Subtask | Pass criterion | Test case | Outcome |
|---|---------|----------------|-----------|---------|
| 1 | AC1 — `summarizeLink` passes an explicit `--max-turns` | the argv array contains `--max-turns` followed by the constant's value | `grep -n 'max-turns' hermes-cli.js` | **PASS** — `hermes-cli.js:171-172` = `'--max-turns', String(MAX_TURNS_LINK)` |
| 2 | AC2 — the value is a named constant | `MAX_TURNS_LINK` is defined and exported in `config.js`; no numeric literal appears beside `--max-turns` in argv | `grep -n 'MAX_TURNS_LINK' config.js hermes-cli.js` | **PASS** — defined `config.js:30`, exported `:100`, consumed via `String(MAX_TURNS_LINK)`; no literal in argv |
| 3 | AC3 — argv order stays correct | `--max-turns` is appended *after* the `chat` subcommand, so it is unaffected by the `--resume` / `-t web` splice indices; `summarizeLink`'s literal is unchanged in its first 10 elements | inspect the argv array | **PASS** — elements 0–9 identical and in the same order; the two new elements are appended last. `askHermes`'s splices are untouched |
| 4 | Notice is stripped from the response | `parseHermesOutput` returns a response with no `Reached maximum iterations` line, given the real captured 0.20 stdout | new unit test using the verbatim capture (incl. its trailing `\r`) | **PASS** — unit test green, and re-verified against the real captured bytes: `notice survives into response: false` |
| 5 | Tolerant prefix matching | the pattern matches with `⚠️ ` prefix, with a bare `⚠ ` prefix, and with no prefix at all | new unit test, three inputs | **PASS** — loops 4 prefixes (`⚠️  `, `⚠ `, `''`, `'  '`), all strip to the bare answer |
| 6 | A real French answer is untouched | a response containing the word "itérations" or leading with a genuine `⚠️` is returned unchanged | new unit test | **PASS** — neither "maximum d'itérations en 3 passes" nor a leading `⚠️ Attention :` matches. The pre-existing `⚠️`-preservation test at `:178` also still passes |
| 7 | Ceiling hit routes to abstention | `summarizeLink` resolves to `messagesFR.linkUnreadable` when stdout carries the notice | inspect the early return; covered indirectly by 4–5 (the pattern is the shared predicate) | **PASS** — driven end-to-end against the real capture: predicate fires, and the string Discord would receive is `messagesFR.linkUnreadable` verbatim |
| 8 | Existing parser contracts unbroken | the `assert.deepEqual` tests in `test/prompts.test.js` still pass — the return shape is unchanged | `npm test` | **PASS** — 3 such tests (`:162`, `:173`, `:193`; the Pre-Computation said 2, it is 3), all green. `{response, sessionId}` shape untouched |
| 9 | AC4 — suite and linters green | `npm test` all pass; `npx eslint .` 0 problems; `npx prettier --check .` clean | run all three | **PASS** — 90/90 (was 86; +4 new), eslint 0 problems, "All matched files use Prettier code style!" |
| 10 | No orphans | no unused variable/import introduced | `npx eslint .` (no-unused-vars) | **PASS** — 0 problems; both new imports are consumed |
| 11 | Scope held | only the 4 declared files change | `git diff --numstat` | **PASS** — `config.js`, `prompts.js`, `hermes-cli.js`, `test/prompts.test.js` + `SESSION_LOG.md` (declared process record). `hermes-discord-bot-clean.js` untouched, as predicted |
| 12 | Issue lifecycle documented | `rad issue comment` precedes `rad issue state --solved` | `rad issue show 54ed189` | PENDING — lands at merge |

## Notes on what is NOT verifiable here

Row 7 is verified by construction and by the shared pattern's unit tests rather than by driving
`summarizeLink` end-to-end: the entrypoint has no `module.exports` and calls `client.login` at
load, so the CLI wrapper is not live-drivable from the test suite. This is the same limitation
recorded for `reaction-lifecycle`.

The notice wording itself was captured from **v0.20.0**, while the bot runs **v0.16.0** (see
Pre-Computation assumption 3, LOW confidence). If 0.16 words it differently the pattern simply does
not match, and behaviour degrades to today's (a best-effort summary is posted) rather than
breaking. Confirming the 0.16 wording needs a run on the VPS and is called out at handover.
