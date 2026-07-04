# Session Journal

Append-only transcript of `@YackShavingSkill` tasks for this repo. Pre-Flight
before coding, Post-Flight after. Never overwrite — only append new `# Task:`
sections. (TRIVIAL tasks are exempt and live only as a Verification Matrix under
`.artifacts/`; e.g. `dotenvx-runtime-dep`.)

---

# Task: watchdog-restart-reset
complexity_score: 4
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will add a single `RESTART_COUNT=0` reset on the
  healthy-check branch. I will NOT rewrite the supervision model (no
  systemd/`pm2 startup`, no time-windowed failure tracker, no env-config knobs).
- **Scope Boundaries:**
  - In-scope: `hermes_watchdog.sh`
  - Out-of-scope: `README.md` (already correct), `start_after_reboot.sh`,
    `manage_hermes.sh`, `hermes-discord-bot-clean.js`, `package.json`

### Simplicity Strategy
`MINIMAL`

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only the
  line the bug names)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` ("while I'm here"
  accretion — the temptation to rewrite the whole watchdog)

### Assumptions
`.artifacts/watchdog-restart-reset/pre_computation_block.md`

---

## Post-Flight Entry

### Reflex Audit
`PASSED`

Rationale: the final change is the single `RESTART_COUNT=0` reset committed to in
Pre-Flight (1 logical LOC, Target == Actual). No supervision-model rewrite, no new
flags, no env knobs — the Simplicity Goal held. The diff touches only
`hermes_watchdog.sh` (plus the declared framework artifacts/journal).

### Violation Checklist
- [ ] **Complexity Creep** — none. One assignment + one comment.
- [ ] **Scope Bleed** — none. Only `hermes_watchdog.sh` changed for the code edit;
  artifacts + journal are declared in the Change Boundary File Touch List.
- [ ] **Style Drift** — none. Matches `examples/patterns/surgical-diff.md` (change
  only the line the bug names).
- [x] **Issue Lifecycle** — performed at merge: a `rad issue comment` recording
  the commit SHAs and verification precedes `rad issue state --solved 82e32d7`
  (see the issue history). Box checked once that comment+transition lands.

### Verification Results
`.artifacts/watchdog-restart-reset/verification_matrix.md`

All four matrix subtasks PASS via static check + `bash -n`. End-to-end
crash/reboot survival is deferred to VPS deploy (no host access here), recorded
honestly rather than asserted.

---

# Task: prompt-eval-harness
complexity_score: 5
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will extract the 3 prompts + `extractThemes` verbatim into
  `prompts.js`, import them in the bot, and add a dependency-free `node:test` +
  `evals/` runner. I will NOT add a shared style constant, an eval framework, a
  coded LLM-judge, or re-implement the Hermes output parser.
- **Scope Boundaries:**
  - In-scope: `prompts.js`, `hermes-discord-bot-clean.js`, `test/prompts.test.js`,
    `evals/*`, `package.json`
  - Out-of-scope: watchdog/deploy scripts, `unwrapText`/output parser (dcdec9e),
    `CLAUDE.md`, `README.md`

### Simplicity Strategy
`MINIMAL`

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (replace inline
  literals with calls; change nothing else) and `examples/patterns/minimal-scaffold.md`
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` (no
  generic eval framework)

### Assumptions
`.artifacts/prompt-eval-harness/pre_computation_block.md`

---

## Post-Flight Entry

### Reflex Audit
`PASSED`

Rationale: the Simplicity Goal held in full — prompts extracted verbatim (byte-identity
proven by `npm test`), the bot only swapped call sites (net −17 LOC), and nothing on the
Abstinence List was added (no shared constant, no eval framework, no coded judge, no
parser re-impl). The Line-Count Budget was under-estimated (+61% vs Target 90) — recorded
as a Simplify Trigger; the overage is irreducible test + eval-runner I/O, not complexity
creep, so the audit passes on the goal while honestly flagging the estimate.

### Violation Checklist
- [ ] **Complexity Creep** — none. No new abstractions; extraction + procedural I/O only.
- [ ] **Scope Bleed** — none. Every touched file is declared in the Change Boundary.
- [ ] **Style Drift** — none. surgical-diff (call-site swap) + minimal-scaffold (plain scripts).
- [x] **Issue Lifecycle** — comment precedes `rad issue state --solved dbf02a1` (see issue history).

### Verification Results
`.artifacts/prompt-eval-harness/verification_matrix.md`

All six subtasks PASS; `npm test` 8/8. Caught + fixed a test-discovery bug (root
`test-token.js` swept up by `node --test`) during verification. End-to-end recap
compliance rates need the real hermes profile (deferred to where hermes runs).

---

# Task: timeout-web-aware
complexity_score: 3
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will delete the dead `HERMES_CONFIG` and replace it with
  three named constants (`TIMEOUT_NORMAL` 90s, `TIMEOUT_WEB` 150s, `TIMEOUT_RECAP`
  120s), then make `askHermes`'s default web-aware (`useWebTools ? TIMEOUT_WEB :
  TIMEOUT_NORMAL`). I will NOT revive a config object, add env-var knobs, add
  retry/backoff, or touch the `clarify`-tool concern.
- **Scope Boundaries:**
  - In-scope: `hermes-discord-bot-clean.js`
  - Out-of-scope: `prompts.js`, `README.md`, `CLAUDE.md`, `hermes_watchdog.sh`,
    `manage_hermes.sh`, `package.json`, the Hermes output parser

### Simplicity Strategy
`MINIMAL`

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only the
  lines the bug names — the timeout default + the dead config)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (reviving a
  one-consumer config object as indirection)

### Assumptions
`.artifacts/timeout-web-aware/pre_computation_block.md`

---

## Post-Flight Entry

### Reflex Audit
`PASSED`

Rationale: the Simplicity Goal held exactly. The dead `HERMES_CONFIG` was deleted
and replaced with three named constants; `askHermes`'s default became web-aware in a
single ternary; the recap call and `summarizeLink` now name their constants. Nothing
on the Abstinence List was added — no config object, no env knobs, no retry, no
`clarify` handling. Diff is 6 logical LOC, Target == Actual (delta 0), one file. The
`customTimeout` override path is byte-unchanged in behaviour, so recap (120s) is
preserved.

### Violation Checklist
- [ ] **Complexity Creep** — none. Two static timeout buckets via a ternary; no new abstraction.
- [ ] **Scope Bleed** — none. Only `hermes-discord-bot-clean.js` changed for code; artifacts + journal + METRICS are declared in the Change Boundary File Touch List.
- [ ] **Style Drift** — none. Matches `examples/patterns/surgical-diff.md` — changed only the timeout default + the dead config the issue names.
- [x] **Issue Lifecycle** — performed at merge: a `rad issue comment` recording patch ID + HEAD SHA, review/merge method, and build outcome precedes `rad issue state --solved 35226d2`. Box checked once that comment + transition lands.

### Verification Results
`.artifacts/timeout-web-aware/verification_matrix.md`

All seven matrix subtasks PASS via static grep + `node --check` (exit 0). End-to-end
confirmation that a real `-t web` question now survives past 62s needs the live hermes
profile on the VPS (`/data/.local/bin/hermes`); deferred to deploy rather than asserted.

---

# Task: processed-messages-bound
complexity_score: 3
complexity_tier: STANDARD

Issue: 2f4e52a — PROCESSED_MESSAGES Set grows unbounded — memory leak in long-lived process.

## Pre-Flight Entry

### Reflex Check
- Simplicity Goal: I will use a fixed-capacity FIFO over the existing insertion-ordered
  `Set` (one `MAX_PROCESSED_MESSAGES` constant + one `rememberMessage()` helper). I will
  NOT use a TTL map, timers, a true LRU, an env-configurable cap, or a third-party cache.
- Scope Boundaries:
  - In-scope: `hermes-discord-bot-clean.js` (declaration + two `.add()` call sites)
  - Out-of-scope: the `:564` `.has()` guard (read path is correct), `prompts.js`,
    `README.md`, `CLAUDE.md`, the Hermes banner parser, and sibling issues df0d693/1ff433a

### Simplicity Strategy
`MINIMAL`

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only what the bug
  names — bound the write path, leave the guard untouched)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (reviving a cache library or
  wrapper class for ~7 lines of logic)

### Assumptions
`.artifacts/processed-messages-bound/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
`PASSED`

Rationale: the Simplicity Goal held exactly. The fix is one named cap and a four-line
`rememberMessage()` helper doing FIFO eviction over the insertion-ordered `Set`; the two
`.add()` call sites now route through it and the `:564` `.has()` guard is byte-unchanged.
Nothing on the Abstinence List was added — no TTL map, no timer, no env knob, no LRU
re-ordering, no cache library, no wrapper class. Diff is 7 logical LOC in one file,
Actual 7 vs Target 8 (delta -1, under budget). Runtime harness confirms the set caps at
1000, evicts oldest-first, and still suppresses an in-window duplicate.

### Violation Checklist
- [ ] **Complexity Creep** — none. A size cap + FIFO delete; no abstraction beyond a free function.
- [ ] **Scope Bleed** — none. Only `hermes-discord-bot-clean.js` changed for code; artifacts + journal + METRICS are all declared in the Change Boundary File Touch List.
- [ ] **Style Drift** — none. Matches `examples/patterns/surgical-diff.md` — bounded the write path the issue names, left the guard alone.
- [x] **Issue Lifecycle** — performed at merge: a `rad issue comment` recording patch ID + HEAD SHA, review/merge method, and build/test outcome precedes `rad issue state --solved 2f4e52a`. Box checked once that comment + transition lands.

### Verification Results
`.artifacts/processed-messages-bound/verification_matrix.md`

Six of seven matrix subtasks PASS now via `node --check` (exit 0), grep counts (0 raw
adds / 2 helper calls), an unchanged guard line, and a runtime harness (size==1000,
oldest evicted, in-window dedup holds). The seventh (issue lifecycle) lands at merge.

---

# Task: hermes-quiet-parse
complexity_score: 5
complexity_tier: STANDARD

## Pre-Flight Entry
### Reflex Check
- Simplicity Goal: I will use one pure `parseHermesOutput(stdout, stderr)` and the documented `-Q` programmatic contract. I will NOT keep any `⚕ Hermes` banner / box-drawing scraping or a non-quiet code path.
- Scope Boundaries:
  - In-scope: prompts.js, test/prompts.test.js, hermes-discord-bot-clean.js
  - Out-of-scope: manage_hermes.sh, README.md, CLAUDE.md, evals/

### Simplicity Strategy
STANDARD

### Contextual Retrieval
- Gold Standard: examples/patterns/surgical-diff.md (replace only the extraction contract; leave prompt builders and unwrapText alone)

### Assumptions
.artifacts/hermes-quiet-parse/pre_computation_block.md

## Post-Flight Entry
### Reflex Audit
PASSED. The diff swaps the extraction contract only: two banner loops + extractSessionId deleted, one tested pure parser added; net −48 lines in the bot. No non-quiet path or banner scraping remains (grep clean). Live 0.17.0 verification first settled the `-Q` shape (response on stdout, `session_id:` on stderr) and confirmed the old scraper was NOT broken, so this is proactive, not a fix.

### Violation Checklist
- [ ] **Complexity Creep** — none. A single free function beside extractThemes; no abstraction, no toggle.
- [ ] **Scope Bleed** — none. Three files changed, all in the Change Boundary File Touch List; artifacts + journal declared.
- [ ] **Style Drift** — none. Mirrors the prompts.js extract-and-test pattern (extractThemes) and surgical-diff.md.
- [x] **Issue Lifecycle** — performed at merge: a `rad issue comment` recording patch ID + HEAD SHA, review/merge method, and `node --test` outcome precedes `rad issue state --solved 9864045`. Box checked once that comment + transition lands.

### Verification Results
.artifacts/hermes-quiet-parse/verification_matrix.md

All 14 unit tests PASS (8 prior + 6 new), `node --check` clean on bot + prompts, grep confirms no `⚕ Hermes`/inAnswer/extractSessionId/quiet leftovers, and `-Q --source tool` present at both execFile sites. End-to-end against live prod lands on the VPS redeploy (local default model is misconfigured — orthogonal).

> **Correction (2026-06-27, issue 25e947a):** the verification's model-404 was the stray `HERMES_HOME` junk home (empty, no model) that `hermes` created when run from the repo dir outside dotenvx — NOT a misconfigured local profile. The real `~/.hermes` default is fine. The `-Q` shape findings stand (CLI framing is home/model-independent).

---

# Task: recap-context-file
complexity_score: 6
complexity_tier: COMPLEX

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will add one byte-threshold guard in `askHermes` that offloads *only* the bulky `extraContext` to a temp file under `process.cwd()` and references it via Hermes's own `@file:` context-reference. I will NOT add a stdin/streaming layer (the CLI doesn't read the query from stdin — verified), NOT add a chunking/summarisation pass, and NOT touch the small-prompt argv path (it stays byte-identical for normal @mentions).
- **Scope Boundaries:**
  - In-scope: `hermes-discord-bot-clean.js` (askHermes offload + temp-file helpers), `prompts.js` (one `buildAskPromptWithContextFile` builder + export), `test/prompts.test.js` (unit test for the builder), `.gitignore` (ignore the transient temp file pattern)
  - Out-of-scope: `summarizeLink` (small context, no overflow), `manage_hermes.sh`, `README.md`, `CLAUDE.md`, `evals/` (recap prompt/parser contract unchanged)

### Simplicity Strategy
STANDARD

### Contextual Retrieval
- Gold Standard: examples/patterns/surgical-diff.md (offload at the single shared chokepoint; leave the common path and prompt builders untouched)

### Assumptions
.artifacts/recap-context-file/pre_computation_block.md

## Post-Flight Entry

### Reflex Audit
PASSED. The approach committed to in Pre-Flight held exactly: one byte-threshold guard at the single shared chokepoint (`askHermes`) offloads only the bulky `extraContext` via Hermes's `@file:` reference; no stdin/streaming layer (verified the CLI can't read the query from stdin), no chunking/summarisation, and the small @mention path is byte-identical (offload harness case A confirms a normal prompt produces no temp file and keeps inline `Contexte :`). The one deviation is size, not design: the diff came in at 36 logical LOC vs a 26-line pre-code estimate (+38%). That overage is mandatory I/O scaffolding (write + cleanup helpers with error handling, mirroring `saveCache`/`saveSessionCache`), not added abstraction — re-planned and justified in the Simplicity Review's Simplify Triggers per `skills/simplicity.md` instruction 3, so it is a recorded re-plan, not an unrecorded budget violation.

### Violation Checklist
- [ ] **Complexity Creep** — none. No flag, config knob, class, or generalisation; nothing on the Abstinence List was added. The line overage is necessary I/O scaffolding, recorded as a Simplify Trigger.
- [ ] **Scope Bleed** — none. Changed files (prompts.js, hermes-discord-bot-clean.js, test/prompts.test.js, .gitignore) + artifacts/journal/METRICS are all in the Change Boundary File Touch List; `summarizeLink` left on argv as declared off-limits.
- [ ] **Style Drift** — none. Matches `examples/patterns/surgical-diff.md` (offload at the one chokepoint, common path untouched) and the repo's named-helper idiom; new prompt builder lives in prompts.js beside `buildAskPrompt`.
- [x] **Issue Lifecycle** — performed at merge: a `rad issue comment` recording patch ID + HEAD SHA, review/merge method, and node --check/--test/harness outcomes precedes `rad issue state --solved 1f154fc`. Box checked once that comment + transition lands.

### Verification Results
.artifacts/recap-context-file/verification_matrix.md

9 of 10 matrix subtasks PASS now: `node --check` clean on bot + prompts, `node --test` 19/19 (17 prior + 2 new builder cases), and the offload harness proves the round trip — small prompt stays inline (A), a 148504 B context offloads to a 263 B argv + `@file:` ref under cwd (B), cleanup removes the temp file (C), and Hermes inlines the written file (D: expanded, blocked=False, 35604 tokens, `@copain` mentions kept literal). The 10th (issue lifecycle) lands at merge. Live prod E2E lands on the VPS redeploy (the discord-bot profile/model exists only on the VPS; the `@file:` mechanism is profile-independent and was validated against the real `context_references` module).

---

# Task: test-pure-helpers
complexity_score: 6
complexity_tier: COMPLEX

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will move the existing pure functions verbatim into modules — `text.js` (`unwrapText`, `splitAtBoundaries`, `isNonArticleUrl`) and `recap.js` (`parseTimeframe(content, now)` lifted from the inline recap block) — wire the bot to import them, and unit-test them with built-in `node:test`. I will NOT rewrite the helpers' logic (byte-faithful move), NOT add a test-framework dependency, NOT modularise config/hermes/cache (that is 950dc54), and NOT attempt a full legacy-lint cleanup (the new eslint+prettier is set up and runnable; pre-existing legacy findings are out of scope).
- **Scope Boundaries:**
  - In-scope: `text.js`, `recap.js`, `test/text.test.js`, `test/recap.test.js`, `eslint.config.js`, `.prettierrc`, `package.json`, `hermes-discord-bot-clean.js`
  - Out-of-scope: `prompts.js`, askHermes/summarizeLink, the config/hermes/cache modules (950dc54), manage_hermes.sh, README.md, CLAUDE.md, evals/

### Simplicity Strategy
STANDARD

### Contextual Retrieval
- Gold Standard: examples/patterns/surgical-diff.md (the helpers move byte-faithfully — extract, don't rewrite — so behaviour is provably unchanged; the inline timeframe block becomes a pure `parseTimeframe` with the fetch/extend logic left behind in the handler)

### Assumptions
.artifacts/test-pure-helpers/pre_computation_block.md

## Post-Flight Entry

### Reflex Audit
PASSED. The Simplicity Goal held: `unwrapText`/`splitAtBoundaries` moved into `text.js` byte-for-byte, `parseTimeframe(content, now)` lifted verbatim into `recap.js` (only the date-math; the fetch/extend/cap logic stayed in the handler), bot rewired to import them, and the inline copies deleted (grep-clean). Tests use built-in `node:test` (no dependency). I did NOT rewrite helper logic — and the tests proved it by pinning the *actual* behaviour, which surfaced three pre-existing latent bugs in the timeframe parser (accented French months fail because `\w+` has no `u` flag; English "month of X" isn't matched; ASCII `fevrier` maps to January). Per the "verbatim move" goal these were preserved, documented (recap.js NOTE, two limitation tests, one skipped bug test, Orthogonal Issues), and flagged for a follow-up — not fixed mid-extraction. Line budget 128 vs 145 target (-12%, under); the bot shed 157 lines. eslint(flat)+prettier added; `npm run lint` exits 0 (0 errors, 4 pre-existing legacy warnings).

### Violation Checklist
- [ ] **Complexity Creep** — none. No abstraction/flag/knob; the diff is a relocation + tests + a standard linter config. Nothing on the Abstinence List was added.
- [ ] **Scope Bleed** — none. All changed files (text.js, recap.js, test/text.test.js, test/recap.test.js, eslint.config.js, .prettierrc, package.json, package-lock.json, bot) are in the Change Boundary Touch List; config/hermes/cache modularisation left for 950dc54.
- [ ] **Style Drift** — none. Mirrors the prompts.js module + test/prompts.test.js pattern and surgical-diff.md (move, don't rewrite); helpers grouped by concern (text vs recap).
- [x] **Issue Lifecycle** — performed at merge: a `rad issue comment` recording patch ID + HEAD SHA, review/merge method, and node --test/--check + npm run lint outcomes precedes `rad issue state --solved 6115cc3`. Box checked once that comment + transition lands.

### Verification Results
.artifacts/test-pure-helpers/verification_matrix.md

10 of 11 matrix subtasks PASS now: `node --test` 41 (40 pass / 0 fail / 1 documented-bug skip), `node --check` clean on bot+text+recap, grep confirms no dangling inline defs (only imports + call sites), `npm run lint` exit 0. The 11th (issue lifecycle) lands at merge. Three pre-existing timeframe-parser bugs surfaced by the new tests are documented for a follow-up issue (see flag to user), not fixed here.

---

# Task: modularise-entrypoint
complexity_score: 6
complexity_tier: COMPLEX

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will split the entrypoint along the issue's natural seams by RELOCATING existing code verbatim into modules — `config.js` (constants + env-overridable paths, folding in df0d693), `hermes-cli.js` (askHermes/summarizeLink/temp-file helpers), `cache.js` (the two Maps + load + accessors), and growing `text.js` (+formatHermesResponse, +sendLongResponse) and `recap.js` (+fetchChannelHistory, +scanChannelForLinks) — leaving the entrypoint as Discord client + handlers wiring. The one behaviour-shaped change is `askHermes` → options object (issue requirement) + env-overridable paths (df0d693). I will NOT rewrite handler logic, NOT change prompt/parse contracts, NOT introduce a DI framework or class hierarchy, and I will keep the module graph acyclic (config is a leaf).
- **Scope Boundaries:**
  - In-scope: `config.js`, `hermes-cli.js`, `cache.js` (new); `text.js`, `recap.js` (grow); `hermes-discord-bot-clean.js` (slim to wiring + handlers); `test/modules.test.js` (new module-load test)
  - Out-of-scope: prompts.js contracts, the 3 timeframe bugs (separate follow-up), manage_hermes.sh, README.md, CLAUDE.md, evals/, the watchdog (c226bf1), global error handlers (1ff433a)

### Simplicity Strategy
STANDARD

### Contextual Retrieval
- Gold Standard: examples/patterns/surgical-diff.md (relocation must be behaviour-faithful — move, don't rewrite; the only intentional behaviour deltas are the documented askHermes options-object + env-overridable paths) and examples/patterns/minimal-scaffold.md (new module shape)

### Assumptions
.artifacts/modularise-entrypoint/pre_computation_block.md

## Post-Flight Entry

### Reflex Audit
PASSED. The split followed the issue's seams by relocating code faithfully: config.js (constants + env-overridable paths), hermes-cli.js (askHermes/summarizeLink/temp-file helpers), cache.js (Maps behind save-on-write accessors), text.js (+formatHermesResponse/sendLongResponse), recap.js (+fetchChannelHistory/scanChannelForLinks); the entrypoint slimmed 748→386 lines to client + handlers + notifyAdmin/finalizeReaction/dedup. Behaviour preservation is evidenced beyond `node --check`: the messageCreate handler body is verbatim, `messagesFR` is byte-identical to HEAD (deepEqual against the previous commit's inline object), and the module-load test proves the dependency graph is acyclic with every import resolving. The only intentional behaviour deltas are the two committed-to changes: `askHermes` → options object (issue requirement) and env-overridable paths (df0d693, folded in per the user's decision). Budget came in at 365 logical LOC vs a 280 estimate (+30%) — recorded as a Simplify Trigger: it is relocation volume across a 5-module split (the entrypoint *lost* 433 lines; ~30 LOC is genuinely new), not added complexity.

### Violation Checklist
- [ ] **Complexity Creep** — none. Plain CommonJS modules, no DI/class/abstraction; nothing on the Abstinence List added. The +30% budget overage is relocation, recorded as a Simplify Trigger.
- [ ] **Scope Bleed** — none. All changed files in the Change Boundary Touch List; df0d693's env-overridable paths were folded into config.js by explicit user decision (documented in the issue text + Pre-Flight).
- [ ] **Style Drift** — none. Module + export shape matches prompts.js/text.js/recap.js; surgical-diff (move, don't rewrite); the handler control flow is unchanged.
- [x] **Issue Lifecycle** — performed at merge: `rad issue comment` recording patch ID + HEAD SHA + verification precedes `rad issue state --solved` for BOTH 950dc54 and df0d693 (df0d693 closed by the folded-in env-overridable paths). Box checked once both comment+transition pairs land.

### Verification Results
.artifacts/modularise-entrypoint/verification_matrix.md

10 of 11 matrix subtasks PASS now: `node --check` clean on all 6 files; `node --test` 47 (46 pass / 0 fail / 1 documented-bug skip), including 6 new module-load tests (acyclic graph + exports + df0d693 env-override); `npm run lint` exit 0; messagesFR byte-identical to HEAD; entrypoint 748→386 with no dangling refs / orphan requires. The 11th (issue lifecycle, both issues) lands at merge. Live @mention/link/recap smoke test lands on the VPS redeploy (no automated handler tests exist).

---

# Task: global-error-handlers
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: 1ff433a — Add global error handlers (client error, unhandledRejection) and await replies

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will use one awaited `safeReply` helper + four event registrations (`client.on('error'/'shardError')`, `process.on('unhandledRejection'/'uncaughtException')`) that log and notify. I will NOT add a `withErrorHandling` decorator, `notifyAdmin` throttling, or `process.exit` on uncaught errors.
- **Scope Boundaries:**
  - In-scope: text.js (safeReply), hermes-discord-bot-clean.js (import + 4 reply conversions + 4 handlers), test/text.test.js (safeReply test)
  - Out-of-scope: hermes-cli.js, recap.js, prompts.js, cache.js, config.js, sendLongResponse, manage_hermes.sh / watchdog (issue c226bf1)

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only the un-awaited replies; leave the already-awaited ones)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no catch-all error-handling abstraction accreting responsibilities)

### Assumptions
`.artifacts/global-error-handlers/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. The final diff is exactly the Pre-Flight commitment: one awaited `safeReply` helper in text.js, four un-awaited replies converted to `await safeReply(...)`, and four event registrations (`client.on('error'/'shardError')` log-only, `process.on('unhandledRejection'/'uncaughtException')` log + notifyAdmin, no `process.exit`). No `withErrorHandling` decorator, no notifyAdmin throttle, no exit-on-uncaught — all on the Abstinence List. Solution ≈ 20 logical LOC against a 22 target (Delta −2, within budget). `npm test` 50/50 (2 new), `npm run lint` 0 errors.

### Violation Checklist
- [ ] **Complexity Creep** — no abstractions beyond the helper + 4 handlers committed to in Pre-Flight
- [ ] **Scope Bleed** — only text.js, hermes-discord-bot-clean.js, test/text.test.js changed; all on the Touch List
- [ ] **Style Drift** — safeReply mirrors sendLongResponse (duck-typed message, console.error); handlers sit with existing client.on registrations
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved`, recording patch ID + merge SHA + verification (PENDING at write time, lands at merge)

### Verification Results
`.artifacts/global-error-handlers/verification_matrix.md`

7 of 8 matrix subtasks PASS (both safeReply tests green; no fire-and-forget replies remain; 2 client handlers + 2 process handlers registered with 0 new process.exit; lint 0 errors; 50/50 tests). The 8th (issue lifecycle) is PENDING and lands at merge.

# Task: music-streaming-skip
complexity_score: 2
complexity_tier: TRIVIAL

Radicle issue: e89a541 — Music-streaming/song links summarised as articles — bot must skip them silently

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Extend the existing `NON_ARTICLE_PATTERN` regex (text.js) with music-streaming/player hosts so song links take the same silent-skip branch as YouTube/images. I will NOT add a second predicate, a config knob, or touch `summarizeLink`/`buildLinkPrompt` (the content-aware abstain gate is issue 6b1af90).
- **Scope Boundaries:**
  - In-scope: text.js (`NON_ARTICLE_PATTERN` + doc comment), test/text.test.js (skip-list test)
  - Out-of-scope: hermes-cli.js, prompts.js, hermes-discord-bot-clean.js, config.js — no classification change needed at the call site

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (edit only the pattern; leave the classifier, its call site, and the summary path untouched)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no new "media policy" abstraction — one denylist, edited in place)

### Assumptions
`.artifacts/music-streaming-skip/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff is the Pre-Flight commitment plus one user-requested addition landed mid-task: remove `reddit\.com` from the same regex so reddit posts (real server text, worth summarising) reach the summariser. Both edits are the one `NON_ARTICLE_PATTERN` line + the one test file. No second predicate, no config knob, `summarizeLink`/`buildLinkPrompt` untouched (issue 6b1af90). The reddit scope expansion is recorded as a comment on e89a541 (comment a5e57d4).

### Violation Checklist
- [ ] **Complexity Creep** — one regex edited in place; no abstraction added
- [ ] **Scope Bleed** — only text.js + test/text.test.js (source) changed; reddit removal folded into the same regex per user request, documented on the issue
- [ ] **Style Drift** — new hosts follow the existing alternation style; prettier reformatted 3 pre-existing one-liners (drift the repo's own check already flagged), no logic change
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved`, recording patch ID + merge SHA + verification (PENDING at write time, lands at merge)

### Verification Results
`.artifacts/music-streaming-skip/verification_matrix.md`

6 of 7 matrix subtasks PASS (incident Spotify URL → non-article; 8 music hosts → all non-article; lemonde.fr article → article; reddit posts www+old → article; npm test 52/52; lint 0 errors, 4 pre-existing warnings untouched; prettier clean). The 7th (issue lifecycle) is PENDING and lands at merge.

# Task: summary-format
complexity_score: 5
complexity_tier: STANDARD

Radicle issue: ec634229 — Structured summary format: adaptive Thèse/Idée one-shot for link + @mention summaries

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One shared `buildSummaryFormat()` in prompts.js (adaptive Thèse/Idée + Arguments/Points + Questions), reused by `buildLinkPrompt` and by `buildAskPrompt` behind a `summarize` flag; the @mention path sets `summarize = LINK_PATTERN.test(content)`. I will NOT add a summary module, an intent classifier, or a config knob, and I will NOT touch `buildAskPromptWithContextFile` or general Q&A.
- **Scope Boundaries:**
  - In-scope: prompts.js, hermes-cli.js, hermes-discord-bot-clean.js, test/prompts.test.js, evals/assertions.js, CONTEXT.md, hermes-discord-bot.md
  - Out-of-scope: buildAskPromptWithContextFile (recap/offload path), summarizeLink (already calls buildLinkPrompt), config.js/text.js/cache.js/recap.js

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (add one shared function + a flag; leave general Q&A byte-identical)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no SummaryFormatter class / policy object — one function)

### Assumptions
`.artifacts/summary-format/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: `buildSummaryFormat()` added and reused by both summary paths; `buildAskPrompt` gains a `summarize` flag (default false → plain Q&A byte-identical, verified); the @mention path derives `wantsSummary` from URL-presence and enables web tools. No summary module, no classifier, no config knob; buildAskPromptWithContextFile and general Q&A untouched. User pre-approved the full "both paths, adaptive" scope.

### Violation Checklist
- [ ] **Complexity Creep** — format in one shared function; no abstraction beyond it
- [ ] **Scope Bleed** — only the 7 declared source/doc files changed; recap/offload path and Q&A untouched
- [ ] **Style Drift** — prompt builders follow existing style; prettier normalised pre-existing JS drift (kept, per precedent); Markdown drift is pre-existing + ungated, docs left surgical
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge

### Verification Results
`.artifacts/summary-format/verification_matrix.md`

7 of 8 matrix subtasks PASS (plain Q&A byte-identical; summarize appends the format; buildLinkPrompt embeds it; adaptive markers present; hasLinkStructure re-keyed true/false; entrypoint wiring at lines 315/316/326; npm test 56/56; lint 0 errors; prettier clean on changed JS). The 8th (issue lifecycle) is PENDING and lands at merge.

# Task: strip-reading-progress
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: c0003a51 — Strip Hermes tool-progress lines (📄/📖 Reading …) leaking into bot replies past -Q

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will add ONE narrow line-filter (`/^\s*(?:📄|📖) Reading /u`) on the `stdout.split('\n')` inside `parseHermesOutput`, dropping the two Hermes trace forms (`📄 Reading <url>`, `📖 Reading <file> L<range>`). I will NOT add a tool-progress abstraction, a leading-only skip branch, a config knob, or touch the hermes-cli.js call sites (they inherit the fix).
- **Scope Boundaries:**
  - In-scope: prompts.js (parseHermesOutput), test/prompts.test.js
  - Out-of-scope: hermes-cli.js (both call sites inherit via the return value), text.js (`📄 Réponse détaillée` is a Discord embed field, not trace), the prompt builders

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only the parser line the bug needs; mirror the existing narrow ⚠/clarify strip discipline)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no "tool-progress sanitiser" object accreting every future -Q leak — one filter for the one shape that leaks today)

### Assumptions
`.artifacts/strip-reading-progress/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. The final diff matches the Pre-Flight commitment exactly: one named regex (`READING_TRACE`) plus a `.filter` on `stdout.split('\n')` inside `parseHermesOutput` — 3 logical LOC, under the 4-line budget. No tool-progress abstraction, no leading-only branch, no config knob; the hermes-cli.js call sites and text.js were left untouched and inherit the fix through the return value. Line-wise (not leading-only) was chosen deliberately so an interleaved trace line is also stripped — verified by a dedicated test.

### Violation Checklist
- [ ] **Complexity Creep** — one filter for the one trace shape that leaks today; the "unify the three -Q strippers" idea was logged as an Orthogonal Issue, not built
- [ ] **Scope Bleed** — only the 2 declared files changed (prompts.js, test/prompts.test.js); no drive-by edits
- [ ] **Style Drift** — mirrors the existing narrow ⚠/clarify strip idiom; eslint 0 errors, prettier clean on both changed files
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved` (patch ID + merge SHA + verification + the "redeploy alone won't fix" finding); PENDING at write time, lands at merge

### Verification Results
`.artifacts/strip-reading-progress/verification_matrix.md`

5 of 6 matrix subtasks PASS: leading trace lines stripped to the answer only; an interleaved trace line stripped (line-wise); a real answer that leads with 📖 or mentions "reading" left byte-identical; the ⚠/clarify/session-id contracts still hold (combined-leak spot check yields the clean answer + preserved id); `npm test` 59/59, eslint 0 errors, prettier clean. The 6th (issue lifecycle) is PENDING and lands at merge.

Finding for the issue's 4th acceptance criterion: **a prod redeploy alone would NOT fix this.** `parseHermesOutput` has never stripped 📄/📖 lines in any build (confirmed by reading current source + `git log 51d38dc..HEAD -- prompts.js`, which shows only summary-format + recap-context-file touched it). The code change is required.

# Task: mention-gate
complexity_score: 4
complexity_tier: STANDARD

Radicle issue: f482c08 — Bot replies to non-mentions: mentions.has() counts @everyone / roles / reply-to-bot as a mention

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Add ONE pure helper `mentionsUser(content, userId)` to text.js that tests for the bot's typed `<@id>`/`<@!id>` token, and use it in place of `message.mentions.has(client.user.id)` at the gate. I will NOT add a mention-parser module, a config knob, or a reply-continuation feature; I will NOT touch the entrypoint mention-STRIP loop, recap/prompts/hermes-cli/cache/config, or the auto-link path.
- **Scope Boundaries:**
  - In-scope: text.js, hermes-discord-bot-clean.js (the gate line + import), test/text.test.js
  - Out-of-scope: entrypoint strip loop (178-182), recap.js/prompts.js/hermes-cli.js/cache.js/config.js, auto-link path

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (fix the gate the bug is in; reuse the existing `<@!?id>` token definition rather than discord.js's over-eager has())
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no Discord-utils/mention-parser object — one 1-line predicate)

### Assumptions
`.artifacts/mention-gate/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: a pure `mentionsUser` helper (2 logical LOC) replaces `message.mentions.has()` at the gate; @everyone/@here, role pings, and replies-to-the-bot no longer count as a mention, while genuine @mentions and DMs are unaffected. No module, no config knob, no reply-continuation feature; the strip loop and all other modules untouched. Root cause was confirmed from the installed discord.js `MessageMentions.has()` source (everyone/repliedUser/roles counted by default) before coding.

### Violation Checklist
- [ ] **Complexity Creep** — one 1-line predicate + a rewired assignment; reply-continuation deliberately abstained (logged as a product decision, not built)
- [ ] **Scope Bleed** — only the 3 declared source/test files changed; strip loop + other modules untouched. Prettier normalised ONLY my added lines (import wraps), no whole-file reformat
- [ ] **Style Drift** — helper mirrors the pure-classifier style of `isNonArticleUrl`; eslint 0 errors (4 pre-existing warnings untouched); prettier clean on changed JS
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge

### Verification Results
`.artifacts/mention-gate/verification_matrix.md`

9 of 10 matrix subtasks PASS: plain sentence / @everyone / @here / other-user / substring-id / empty-input all → false (no trigger); genuine `<@id>` and `<@!id>` → true (still triggers); reply-to-bot is false by construction (content-only helper, no token in a reply); DMs unaffected (gate is `isMentioned || isDirectMessage`, only isMentioned changed); npm test 66/66, eslint 0 errors, prettier clean. The 10th (issue lifecycle) is PENDING and lands at merge.

# Task: reply-to-bot
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: 92b16a6 — Reply-to-bot counts as a mention (continue a conversation without re-typing @Bot)

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Add ONE pure helper `isReplyTo(message, userId)` (= `message?.mentions?.repliedUser?.id === userId`) and OR it into the existing `isMentioned` gate, so a reply to the bot routes through the same Q&A path as an @mention. I will NOT fetch the referenced message, add a separate reply branch, re-introduce `message.mentions.has()`, or touch mentionsUser / the summary paths.
- **Scope Boundaries:**
  - In-scope: text.js, hermes-discord-bot-clean.js (gate + import), test/text.test.js
  - Out-of-scope: mentionsUser, recap/auto-link/@mention-summary paths, config/prompts/hermes-cli/cache/recap

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (compose a second predicate into the existing gate; reuse the whole Q&A path unchanged)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no reply-handling subsystem — one predicate)

### Assumptions
`.artifacts/reply-to-bot/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the commitment: pure `isReplyTo` (2 logical LOC) OR-ed into the gate; a reply to the bot triggers the Q&A path while @everyone/@here, role pings, plain messages, and replies-to-other-people still do not (f482c08 holds — mentionsUser unchanged, isReplyTo only adds bot-replies). No fetch, no new event, no config knob. Confirmed `repliedUser` semantics from the installed discord.js source before coding.

### Violation Checklist
- [ ] **Complexity Creep** — one predicate OR-ed into the gate; no fetch/handler/subsystem
- [ ] **Scope Bleed** — only the 3 declared source/test files changed; prettier touched only my added lines
- [ ] **Style Drift** — isReplyTo mirrors mentionsUser's pure-helper style; eslint 0 errors (4 pre-existing warnings untouched); prettier clean
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge

### Verification Results
`.artifacts/reply-to-bot/verification_matrix.md`

7 of 8 matrix subtasks PASS: reply-to-bot → true; reply-to-other / non-reply / missing-shape → false; f482c08 noise fix holds (mentionsUser suite unchanged); gate composes `mentionsUser || isReplyTo`; npm test 70/70, eslint 0 errors, prettier clean. The 8th (issue lifecycle) is PENDING and lands at merge.


# Task: reaction-summaries
complexity_score: 4
complexity_tier: STANDARD

Radicle issue: c8dafc0 — Reaction-triggered summaries: react 📝 to summarise a link; remove auto-summary-on-post

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** I will add ONE pure `extractArticleLinks(content)` (text.js), ONE `SUMMARY_REACTION` constant (config.js), enable the `GuildMessageReactions` intent + `Partials.Channel/Message/Reaction`, MOVE the auto-detect summarise-and-reply body verbatim into a `summariseArticleLinks(message, links)` fn, add a `messageReactionAdd` handler (partials → 📝 → guild → dedup → summarise), and DELETE the old auto-detect block. I will NOT refactor the working messageCreate dedup, add a link-count/emoji config knob, handle DM reactions, or support un-reacting.
- **Scope Boundaries:**
  - In-scope: text.js, config.js, hermes-discord-bot-clean.js (intents/partials + handler + extracted fn + block removal + import swap), test/text.test.js
  - Out-of-scope: hermes-cli.js, prompts.js, recap.js, cache.js, and the @mention/DM Q&A + recap handlers

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (move the summarise body verbatim rather than rewrite it; reuse `summarizeLink`/`setCachedLink`/`finalizeReaction` unchanged; the reaction handler is the only net-new logic)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no reaction-router/link-service object — one pure helper + one thin handler)

### Assumptions
`.artifacts/reaction-summaries/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: a pure `extractArticleLinks` (text.js), a `SUMMARY_REACTION` constant (config.js), the `GuildMessageReactions` intent + `Partials.Channel/Message/Reaction` (the inert v13 `'CHANNEL'` string fixed to the enum), the auto-detect summarise-and-reply body moved VERBATIM into `summariseArticleLinks(message, links)`, a thin `messageReactionAdd` handler (emoji-first short-circuit → partial-resolve → guild → dedup → summarise), and the old auto-detect block deleted. No generic bounded-set factory (mirrored the existing FIFO instead), no link-count/emoji config knob, no DM-reaction support, no un-react handling — all logged as abstained. Partials/intent/event surface verified against the installed discord.js 14.26.4 before coding (`Partials.Channel/Message/Reaction` = 1/3/4; `Events.MessageReactionAdd`).

### Violation Checklist
- [ ] **Complexity Creep** — net-new logic is one pure helper + one thin handler + a mirrored dedup set; `summariseArticleLinks` is a verbatim extract, not new code. Budget re-planned 65→90 for the moved lines (justified in simplicity_review, no new branching).
- [ ] **Scope Bleed** — only the 4 declared files changed. config.js kept surgical: prettier wanted to reformat two PRE-EXISTING `aujourd'hui` apostrophe lines (already dirty on HEAD, proven via `git show HEAD:config.js | prettier --check`); I reverted that drive-by so my diff is only the 2 added lines.
- [ ] **Style Drift** — `extractArticleLinks` mirrors `isNonArticleUrl`'s pure-classifier style; the handler mirrors the existing `messageCreate` try/catch + FIFO idiom; eslint 0 errors (4 pre-existing `no-unused-vars` warnings, unchanged count — 3 moved with the verbatim code); prettier clean on all my changed lines.
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/reaction-summaries/verification_matrix.md`

10 of 11 matrix subtasks PASS: extractArticleLinks returns article links / drops non-articles / [] on no-link / keeps order / no-throw on empty-null (6 new unit tests, 76/76 total); `SUMMARY_REACTION === '📝'` exported; Partials fixed to the enum + module `node --check` clean; auto-detect block removed (grep confirms); `isNonArticleUrl` orphan import removed (eslint clean); npm test 76/76, eslint 0 errors, prettier clean on changed JS. The 11th (issue lifecycle) is PENDING and lands at merge. Runtime Discord behaviour (react 📝 on a live message) is deferred to the post-deploy check on the VPS — not reproducible from the local checkout.
