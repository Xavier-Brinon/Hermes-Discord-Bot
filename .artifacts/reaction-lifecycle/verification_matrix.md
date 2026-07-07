---
artifact_type: verification_matrix
task_id: reaction-lifecycle
timestamp: 2026-07-07T14:59:33Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 — 👀 reliably removed on every terminal outcome | `finalizeReaction` sweeps all `r.me` reactions (not `cache.get('👀')`), hydrating via `message.fetch()` when the cache is empty (fetched/older message) | model script: seed a message whose cache is empty + a `.me` 👀 present only after fetch; assert 👀 gone on success/abstain/error | PASS — model AC1: success/abstain/error each leave only `['✅']`/`['⚠️']`/`['❌']` (no 👀); the empty-cache case fetches, then sweeps the 👀 → only `['✅']` |
| AC2 — real→✅, abstention→⚠️, hard error→❌ | `summariseLinks` picks `abstained ? '⚠️' : '✅'`; the catch path adds ❌; recap/@mention success/error map to ✅/❌ | model script: (a) real → ✅; (b) all summaries === `linkUnreadable` → ⚠️; (c) all links throw → ❌; (d) mixed → ✅ | PASS — model AC2: real→✅+true, all-abstain→⚠️+true, all-throw→❌+false, mixed(≥1 real)→✅ |
| AC3 — stale ❌/⚠️ cleared when a retry succeeds | second attempt's `finalizeReaction` removes the prior `.me` ❌ before adding ✅ → only ✅ remains (no stack) | model script: attempt 1 → ❌ present as `.me`; attempt 2 succeeds → assert final `.me` reactions == `['✅']` | PASS — model AC3: attempt 1 → `['❌']`; attempt 2 (re-react 👀 + success) → stale ❌ **and** fresh 👀 both swept → `['✅']` |
| AC4 — hard error drops the triggering 📝 (best-effort) | on `summariseLinks` returning `false`, handler calls `reaction.users.remove(user.id)` inside `catch {}`; a throw (no Manage Messages) does not crash the handler | model script: (a) removal succeeds → 📝 removed; (b) removal throws → handler still returns, no throw escapes | PASS — model AC4: error → 📝 removed; perm-absent (remove rejects) → handler swallows it, no throw escapes, still retryable |
| Real & abstention both marked done (not retryable) | `summariseLinks` returns `true` for real AND abstention → `rememberReaction` fires → a re-reaction is a no-op | model script: abstention → `REACTED.has(id)` true; real → `REACTED.has(id)` true | PASS — model bookkeeping: real → remembered; abstention → remembered |
| Hard error stays retryable | `summariseLinks` returns `false` → id NOT remembered → re-reaction re-enters | model script: error attempt → `REACTED.has(id)` false | PASS — model bookkeeping: hard error → NOT remembered (retryable) |
| `finalizeReaction` param change safe across all call sites | all callers pass an emoji string; none passes a boolean | `grep -n finalizeReaction` → def + 7 emoji-arg calls, 0 boolean args | PASS — def + 7 calls (6 pre-existing swapped to `'✅'`/`'⚠️'`/`'❌'` + 1 new `'❌'` in the summariseLinks catch); `grep -E "finalizeReaction\(message, (true\|false)\)"` → 0 hits |
| No regression | full suite still green | `npm test` | PASS — 86/86 pass |
| Lint — no NEW warnings | 0 errors; ≤ 4 warnings; new best-effort catches are bindingless `catch {}` | `npx eslint hermes-discord-bot-clean.js` | PASS — 0 errors, 1 warning (the pre-existing `pendingMsg.delete` `catch (_)` at :489, cb42d9b); 0 NEW; the other 3 baseline warnings' lines were rewritten/deleted by the AC work |
| Prettier clean on changed file | changed file matches prettier style | `npx prettier --check hermes-discord-bot-clean.js` | PASS — "All matched files use Prettier code style!" |
| Issue lifecycle documented | `rad issue comment` (patch ID + merge SHA + verification) posted BEFORE `rad issue state --solved` | `rad issue show ffed210` shows the transition comment | PENDING — lands at merge (comment precedes state change) |
