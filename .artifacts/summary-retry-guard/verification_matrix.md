---
artifact_type: verification_matrix
task_id: summary-retry-guard
timestamp: 2026-07-07T13:15:02Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 — failed summary is retryable | after `summariseLinks` returns `false`, the id is NOT in `REACTED_MESSAGES`, so a re-reaction re-enters the attempt | model script: fail the first attempt, assert the second re-reaction calls `summariseLinks` again | PASS — `guard-model.mjs` AC1: 1st attempt false → `REACTED.has('m1')` false; 2nd reaction succeeds → remembered + posts `['SUMMARY']` |
| AC2 — concurrent reactions summarise once | two reactions arriving before the summary finishes → exactly one `summariseLinks` call; the second sees `SUMMARISING_MESSAGES` and returns | model script: fire two reactions with an in-flight (unresolved) summary, assert call count == 1 | PASS — `guard-model.mjs` AC2: two concurrent `handler` calls with an in-flight (gated) summary → `calls == 1` |
| AC3 — partial multi-link failure posts successes | with 3 links where the middle throws, the 2 successes are still joined + posted and `finalizeReaction(true)` runs; only all-3-fail returns `false` | model script: middle link throws, assert 2 summaries posted + result `true`; all-fail asserts `false` | PASS — `guard-model.mjs` AC3: middle link throws → posts `['S(a)','S(c)']` + remembered; all-fail → posts `[]`, NOT remembered |
| Total failure still cleans up + DMs admin | when every link throws (or react/reply throws), the catch deletes the pending msg, removes 👀, DMs admin, returns `false` | code inspection: catch path (:462–) unchanged, now ends `return false` | PASS — the catch body (pending delete + 👀 removal + `notifyAdmin`) is byte-identical; only `return false;` appended |
| Check-and-set atomicity preserved | no `await` between the guard check and `SUMMARISING_MESSAGES.add` | code inspection: only `extractLinks` (sync) + an `if` sit between them | PASS — :527 guard → :529 `extractLinks` (sync) → :530 `if` → :532 `add`; no `await` between; AC2 model confirms |
| `summariseLinks` return-type change safe | single caller; no other code reads its return | `grep -n summariseLinks` → def + single call only | PASS — one definition + one call (`if (await summariseLinks(...)) rememberReaction(...)`); no other reader |
| No regression | full suite still green | `npm test` | PASS — 86/86 pass |
| Lint clean, no new warnings | 0 errors; the 4 pre-existing warnings unchanged; new `catch (err)` uses `err` | `npx eslint hermes-discord-bot-clean.js` | PASS — 0 errors, 4 warnings (the same empty-catch `_`/`e` at 145/469/476/478; `catch (err)` consumes `err`, adds none) |
| Prettier clean on changed file | changed file matches prettier style | `npx prettier --check hermes-discord-bot-clean.js` | PASS — "All matched files use Prettier code style!" |
| Issue lifecycle documented | `rad issue comment` (patch ID + merge SHA + verification) posted BEFORE `rad issue state --solved` | `rad issue show 5a8db57` shows the transition comment | PENDING — lands at merge (comment precedes state change) |
