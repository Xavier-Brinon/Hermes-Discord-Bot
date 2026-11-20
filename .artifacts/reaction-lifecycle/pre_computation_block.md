---
artifact_type: pre_computation_block
task_id: reaction-lifecycle
timestamp: 2026-07-07T14:59:33Z
complexity_score: 3
complexity_tier: STANDARD
---

## Complexity Score

| Dimension    | Value | Rationale                                                                                          |
|--------------|-------|---------------------------------------------------------------------------------------------------|
| Scope Size   | 0     | One source file (`hermes-discord-bot-clean.js`). No new config string; ✅/⚠️/❌ are reactions.     |
| Ambiguity    | 1     | Issue is detailed, but the three-way encoding + abstention detection + perm-guarded 📝 removal are design choices. |
| Risk Surface | 1     | `finalizeReaction` is shared by the @mention/recap/summary flows; user-facing reaction UX, not a critical path. |
| Knowledge Gap| 1     | Partial — had to (re)read the reaction handler, `summarizeLink` abstention sentinel, and discord.js reaction-removal semantics. |
| **Sum**      |       | **3 → STANDARD**                                                                                   |

## Assumptions (ranked)

| # | Assumption | Confidence | Verification |
|---|------------|------------|--------------|
| 1 | `summarizeLink` returns `messagesFR.linkUnreadable` **verbatim** on an honest abstention (hermes-cli.js:187), so `summariseLinks` can detect abstention with a `=== messagesFR.linkUnreadable` compare. | HIGH | Read hermes-cli.js:186-188 — `return resolve(messagesFR.linkUnreadable)`. |
| 2 | `finalizeReaction` has exactly 6 call sites, all in `hermes-discord-bot-clean.js`; changing its 2nd param from boolean→emoji is a contained refactor. | HIGH | `grep -n finalizeReaction` → def + 6 calls (:258,:293,:320,:374,:394,:460 + catch). |
| 3 | `finalizeReaction` always runs seconds after `message.react('👀')` (after Hermes returns), so the bot's own 👀 gateway event has arrived and `.me` is populated in the reactions cache — a `.me` filter reliably sweeps it. | HIGH | The file's existing catch path (:472) already sweeps by `r.me`; every call site reacts 👀 then awaits a slow op before finalizing. |
| 4 | Removing another user's 📝 (`reaction.users.remove(user.id)`) needs Manage Messages; removing the bot's own reactions does not. Wrapping the 📝 removal in a bindingless `catch {}` makes it best-effort (no crash when the perm is absent). | HIGH | discord.js REST: deleting a *different* user's reaction is a Manage-Messages op; the issue's Dependency/risk note says the same. |
| 5 | A bindingless `catch {}` avoids a `no-unused-vars` warning (the only source of the 4 pre-existing warnings; `no-empty` allows empty catch). New best-effort catches use `catch {}`. | HIGH | eslint.config.js:23-24 — `no-unused-vars: warn`, `no-empty: [warn,{allowEmptyCatch:true}]`; baseline `npx eslint` = 4 `no-unused-vars` on `_`/`e`. |
| 6 | The boolean return of `summariseLinks` is enough for the caller: `true` = terminal/not-retryable (real **or** abstention), `false` = hard error (retryable + drop 📝). The ✅-vs-⚠️ split is applied *inside* `summariseLinks`, which alone knows it abstained. | MEDIUM | The issue's own touch-points frame it as "summariseLinks returns false" on hard error; the caller does the same thing (remember + keep 📝) for real & abstention. |

## Design decision

Keep `summariseLinks`'s boolean return (matches issue framing + 5a8db57's retry contract). Make `finalizeReaction(message, resultEmoji)` a dumb helper: sweep every `r.me` reaction (fetch-hydrate first if the cache is empty — the fetched-older-message case), then add the passed emoji. The outcome→emoji decision lives at each call site where the outcome is known. This subsumes the manual `r.me` removal loop in the `summariseLinks` catch (which becomes `finalizeReaction(message, '❌')`) and makes AC3 (clear stale ❌/⚠️ before a successful retry) fall out for free.
