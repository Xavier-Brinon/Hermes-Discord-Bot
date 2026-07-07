---
artifact_type: simplicity_review
task_id: reaction-lifecycle
timestamp: 2026-07-07T14:59:33Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution

Turn `finalizeReaction(message, success:boolean)` into `finalizeReaction(message, resultEmoji)`
— a dumb helper that (a) hydrates the reactions cache with `message.fetch()` only if it is
empty, (b) removes every reaction the bot itself added (`r.me` — the 👀 in-progress marker plus
any stale ✅/⚠️/❌ from a prior attempt), then (c) adds the one emoji it was handed. The six
existing call sites pass the emoji directly (`'✅'` / `'❌'`), and `summariseLinks` picks
`abstained ? '⚠️' : '✅'` on success and routes its catch through `finalizeReaction(message,'❌')`
(replacing the manual `r.me` removal loop). The reaction handler, on a `false` (hard-error)
return, best-effort removes the triggering user's 📝 so re-clicking re-arms the 5a8db57 retry.

## Abstinence List (not added, intentional)

- **A three-value return token (`'ok'|'abstain'|'error'`)** — the caller treats real & abstention
  identically (remember + keep 📝); only hard-error differs. Kept the existing boolean; the
  ✅-vs-⚠️ choice lives inside `summariseLinks`, which alone knows it abstained.
- **Named emoji constants (`RESULT_OK`/`RESULT_WARN`/`RESULT_FAIL`)** — the file's idiom is raw
  inline emoji (`'👀'`, `'✅'`, `'❌'`); adding 3 consts is style drift, not simplification.
- **A dual-type `finalizeReaction` (accept boolean *or* emoji)** — a coercion branch to spare 5
  mechanical call-site edits; explicit emoji at each site is clearer and honours "not a boolean".
- **Removing 👀 by explicit key (`cache.get('👀')`) with a retry/poll for the `.me` race** — the
  helper runs seconds post-react, so `.me` is settled; the empty-cache `fetch()` covers the
  fetched-message case the issue flags. No polling.
- **Doing cb42d9b's empty-catch cleanup** (converting the pre-existing `catch (_)`/`catch (e)`) —
  a different issue. New catches use bindingless `catch {}` *only* because AC5 forbids new warnings.
- **An admin DM on abstention** — abstention is an honest, successful outcome shown to the user;
  only hard errors DM the admin (unchanged).

## Line-Count Budget

| Target | Actual | Delta |
|--------|--------|-------|
|     18 |     18 |     0 |

Target = ~18 logical LOC: finalizeReaction rewrite (~10) + 6 call-site emoji swaps (~6, but 5 are
1-token) + abstention compute (1) + handler 📝-drop (~3) − the deleted manual `r.me` loop (~6).

## Simplify Triggers (detected)

- None. The net change is a helper generalisation (boolean→emoji) whose sweep-all-`r.me` behaviour
  *removes* code (the catch's manual removal loop) while satisfying AC1 (reliable 👀 removal) and
  AC3 (stale-clear) at once. No state machine, no return-token enum, no emoji-constant table, no
  dual-type coercion — all abstained. Under the +25% trigger at delta 0%.
