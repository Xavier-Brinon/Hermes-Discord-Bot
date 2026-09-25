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

# Task: reaction-any-link
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: 71e2200 — 📝 reaction summarises any link (drop host denylist); the human's reaction is the filter

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Replace `extractArticleLinks` with a pure `extractLinks(content)` (every URL, [] when none, NO host filter), delete the now-orphaned `NON_ARTICLE_PATTERN` + `isNonArticleUrl`, point the reaction handler at `extractLinks` (silent only on 0 links), and rename `summariseArticleLinks` → `summariseLinks`. I will NOT add a filter-toggle knob, a link-kind classifier, or keep the denylist dormant.
- **Scope Boundaries:**
  - In-scope: text.js, hermes-discord-bot-clean.js, test/text.test.js, test/modules.test.js, config.js (one comment)
  - Out-of-scope: hermes-cli.js, prompts.js, recap.js, cache.js, the @mention/recap handlers, `ALL_LINKS_PATTERN` (kept)

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (delete the dead denylist rather than keep it "just in case"; one 2-line pure fn replaces the pattern + predicate + filtering extractor)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no URL-classification subsystem — one pure fn)

### Assumptions
`.artifacts/reaction-any-link/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: a 2-line pure `extractLinks(content)` (all URLs, [] when none, no host filter) replaces `extractArticleLinks`; `NON_ARTICLE_PATTERN` + `isNonArticleUrl` deleted; the reaction handler summarises on ≥1 link and stays silent only on 0 links; `summariseArticleLinks` renamed to `summariseLinks`. No filter-toggle knob, no link-kind classifier, no dormant dead code. Net production change is −9 logical LOC (code shrank). Verified by grep before + after that the denylist had exactly one production consumer and that no reference dangles.

### Violation Checklist
- [ ] **Complexity Creep** — the change REMOVES a subsystem; one 2-line pure fn replaces a regex + predicate + filtering extractor. Net −9 LOC.
- [ ] **Scope Bleed** — only the 5 declared files + artifacts/SESSION_LOG/METRICS changed. modules.test.js was already prettier-dirty on HEAD (3 unwrapped long-array lines); my 1-word swap on line 23 kept that existing style, so I did NOT reformat it (would bleed into the 2 unrelated test arrays). config.js prettier-dirty pre-existing (apostrophe lines) — untouched.
- [ ] **Style Drift** — `extractLinks` mirrors the pure-helper style; eslint 0 errors (4 pre-existing warnings, unchanged); prettier clean on text.js/entrypoint/config additions + text.test.js; modules.test.js left in its pre-existing unwrapped style.
- [ ] **Issue Lifecycle** — comment to be posted before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/reaction-any-link/verification_matrix.md`

8 of 9 matrix subtasks PASS: extractLinks returns all links / silent on no-link / keeps YouTube+Spotify (no filter) / no-throw on empty-null (5 new unit tests); denylist removed (grep: no definition/export/prod-reference, only an explanatory comment); no dangling refs (node --check clean, eslint no-undef clean); handler summarises any link via summariseLinks; npm test 71/71 (was 76; −10 denylist tests +5 extractLinks), eslint 0 errors, prettier clean on changed JS except pre-existing modules.test.js/config.js dirt. The 9th (issue lifecycle) is PENDING and lands at merge. Runtime Discord behaviour (📝 on a YouTube link → summary) verified on deploy.

# Task: embed-anchor-summary
complexity_score: 4
complexity_tier: STANDARD

Radicle issue: 1b94451 — 📝 summary: anchor on the Discord embed title/author; abstain if the fetch doesn't match

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Pure `extractLinkMeta(message, url)` (text.js) reads {title, author, provider} off the matching Discord embed; `buildLinkPrompt(url, context, meta)` prepends an anchor + verify-or-abstain-with-sentinel clause (meta=null byte-identical); `summarizeLink(url, context, meta)` maps the sentinel → an honest `messagesFR.linkUnreadable`; `summariseLinks` extracts meta per link. I will NOT add a bot-side title-match comparator, a transcript fetcher, an @mention-path anchor, or a config knob — those are deferred.
- **Scope Boundaries:**
  - In-scope: text.js, prompts.js, hermes-cli.js, hermes-discord-bot-clean.js, config.js, test/text.test.js, test/prompts.test.js
  - Out-of-scope: recap.js, cache.js, buildAskPrompt @mention path, parseHermesOutput

### Simplicity Strategy
STANDARD

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (thread one optional `meta` arg through the existing summary path; meta=null stays byte-identical; one sentinel check, no new subsystem)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no verification/embed-parser object — one pure fn + one prompt clause)

### Assumptions
`.artifacts/embed-anchor-summary/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: pure `extractLinkMeta(message, url)` (text.js) reads {title, author, provider} off the matching embed; `buildLinkPrompt(url, context, meta)` prepends the anchor + verify + `CONTENU_INACCESSIBLE` sentinel clause (meta=null byte-identical — the existing byte-identity test still passes); `summarizeLink(url, context, meta)` maps the sentinel → `messagesFR.linkUnreadable`; `summariseLinks` extracts meta per link. No bot-side title comparator, no transcript fetcher, no @mention-path anchor, no config knob — all abstained. Generated prompt eyeballed (grounded on the real title/author) + sentinel→message mapping simulated.

### Violation Checklist
- [ ] **Complexity Creep** — one pure fn + one optional prompt arg + one sentinel check; meta=null path unchanged. 39 logical LOC vs 35 target (+11%, under trigger). Bot-side comparator + transcript capability explicitly deferred.
- [ ] **Scope Bleed** — only the 7 declared files + artifacts/SESSION_LOG/METRICS changed. config.js kept surgical (prettier flags only the pre-existing `aujourd'hui` lines 52/71, not my linkUnreadable). @mention path + parseHermesOutput untouched.
- [ ] **Style Drift** — extractLinkMeta mirrors the pure-helper style; the sentinel const + message mirror existing config/prompts patterns; eslint 0 errors (4 pre-existing warnings, unchanged); prettier clean on my changed lines.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (patch ID + SHA + verification); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/embed-anchor-summary/verification_matrix.md`

9 of 11 matrix subtasks PASS (unit-testable): extractLinkMeta reads title/author/provider, matches by url, null on no-embed/no-title, null on no-url-match (no wrong anchor), no-throw on missing shape; buildLinkPrompt meta=null byte-identical, with-meta carries title/author/provider + sentinel + VÉRIFICATION; npm test 79/79 (+8), eslint 0 errors, prettier clean on changed JS. The sentinel→honest-message mapping is code-reviewed + simulated (integration — summarizeLink shells out, not unit-run). The 2 remaining — abstention RELIABILITY (prompt-dependent) and issue lifecycle — are DEPLOY/merge-time: the actual "Hermes abstains on the fairy video" can't be reproduced from the local checkout (no Hermes CLI); verified on the VPS after deploy, eval follow-up noted.

# Task: unique-thread-titles
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: a4f5bc2 — Threads all share the title « 📄 Réponse détaillée » — give each a unique/descriptive title

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One pure `buildThreadTitle(raw)` in text.js (prefix `📄 `, collapse whitespace, truncate to 100 code points via `Array.from` on a word boundary, fall back to the existing static `'📄 Réponse détaillée'`); `sendLongResponse(message, text, threadTitle = DEFAULT_THREAD_TITLE)` uses it as the thread name; each caller passes its own best source (@mention → stripped question; link → first embed title). I will NOT add a config knob / options object, migrate the French string into config.messagesFR, split into per-caller title builders, or reach for Intl.Segmenter grapheme clustering.
- **Scope Boundaries:**
  - In-scope: text.js, hermes-discord-bot-clean.js, test/text.test.js
  - Out-of-scope: config.js, recap.js + the recap thread block (`:301`), prompts.js, hermes-cli.js, cache.js

### Simplicity Strategy
STANDARD

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (add an optional param with a default equal to the prior literal; callers opt in; the no-arg path stays behaviourally identical). The word-boundary heuristic mirrors the existing `splitAtBoundaries` idiom (`lastSpace > maxLen * 0.6`).
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (one pure string→string fn, not a TitleFormatter config object).

### Assumptions
`.artifacts/unique-thread-titles/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: one pure `buildThreadTitle(raw)` in text.js (prefix `📄 `, whitespace-collapse, `Array.from` code-point truncation to 100 with a `> maxLen * 0.6` word-boundary cut, fallback to `DEFAULT_THREAD_TITLE`); `sendLongResponse` gained an optional `threadTitle` defaulting to that same literal, so the no-arg path is behaviourally identical; the @mention caller passes `buildThreadTitle(content)`, the link caller passes `buildThreadTitle(extractLinkMeta(message, linksToProcess[0])?.title)`. No config knob, no `messagesFR` migration, no per-caller builders, no Intl.Segmenter — all abstained. Behaviour eyeballed on real French inputs (short → intact; 155-char question → 95-cp clean cut "…systèmes…"; embed title → intact; empty/null → fallback).

### Violation Checklist
- [ ] **Complexity Creep** — one pure fn + one optional param defaulting to the prior literal + two one-line call-site derivations. 17 logical LOC vs 14 target (+21%, under the +25% trigger). No knobs/branches beyond the fallback.
- [ ] **Scope Bleed** — only the 3 declared production/test files + artifacts/SESSION_LOG/METRICS changed. config.js, recap.js, the recap thread block (`:301`), prompts.js, hermes-cli.js, cache.js all untouched.
- [ ] **Style Drift** — `buildThreadTitle` mirrors the pure-helper style and reuses `splitAtBoundaries`' `> maxLen * 0.6` word-boundary idiom; eslint 0 errors (4 pre-existing warnings, unchanged); prettier clean on all changed files.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/unique-thread-titles/verification_matrix.md`

10 of 10 matrix subtasks PASS: 6 new unit tests (short passthrough, whitespace collapse, empty/whitespace/null/undefined fallback, ≤100-cp truncation ending `…`, word-boundary cut, emoji-safe `😀…` cut); `sendLongResponse` default-equals-prior-literal + `name:`-reads-param by diff review; two call sites derive from distinct sources; recap `📊 Thèmes — …` block untouched (diff only touches the two call sites + import); npm test 85/85 (+6), eslint 0 errors, prettier clean. The only deploy-time item is the live Discord confirmation that two threads in a channel show distinct titles — integration, not locally reproducible (no Discord client); verified on the VPS after deploy.

# Task: no-embed-abstain
complexity_score: 2
complexity_tier: STANDARD

Radicle issue: de52e4a — 📝 summary: abstain clause is gated on an embed title — no-embed links can't abstain

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Fill `buildLinkPrompt`'s empty anchor `else` branch with a title-free abstain clause ("Si tu ne peux pas accéder au contenu réel (…), n'invente rien : réponds UNIQUEMENT par CONTENU_INACCESSIBLE et rien d'autre."), and hoist that one sentinel sentence into a shared `abstain` const so the meta and no-meta branches never drift. The meta-present branch stays byte-identical. I will NOT add a second sentinel, a config knob, a placeholder identity anchor, a bot-side heuristic, or any change to hermes-cli.js / config.js.
- **Scope Boundaries:**
  - In-scope: prompts.js, test/prompts.test.js
  - Out-of-scope: hermes-cli.js, config.js, hermes-discord-bot-clean.js, buildAskPrompt @mention path, text.js, recap.js, cache.js, evals/

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (fill one empty branch + extract one shared sentence; the meta path stays byte-identical, no signature change, no new subsystem)
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no verification object, no second sentinel, no config knob — one shared const + one filled branch)

### Assumptions
`.artifacts/no-embed-abstain/pre_computation_block.md`

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment: `buildLinkPrompt`'s empty anchor `else` branch now emits a title-free abstain clause ("Si tu ne peux pas accéder au contenu réel (…), " + a shared `abstain` const naming `CONTENU_INACCESSIBLE`), and the same `abstain` const is spliced into the meta-present branch where the literal used to be — so that branch stays byte-identical (node eyeball confirms; the meta-path tests pass untouched). No second sentinel, no config knob, no placeholder identity anchor, no bot-side heuristic, no hermes-cli.js/config.js change — all abstained. Generated prompts eyeballed: no-meta carries the abstain line + summary format and NO VÉRIFICATION language; meta carries title/author/provider + VÉRIFICATION + sentinel exactly as before.

### Violation Checklist
- [ ] **Complexity Creep** — one shared `abstain` const + one filled else branch; meta path byte-identical. 14 logical LOC vs 12 target (+16.7%, under the +25% trigger). Second sentinel / knob / bot-side heuristic explicitly deferred.
- [ ] **Scope Bleed** — only the 2 declared production/test files changed (+ artifacts/SESSION_LOG/METRICS). hermes-cli.js, config.js, hermes-discord-bot-clean.js, the @mention summary path, text.js, recap.js, cache.js all untouched.
- [ ] **Style Drift** — the shared-const + anchor-ternary shape mirrors the existing idiom; the stale "meta=null is byte-identical to the former prompt" doc-comment was corrected in the same edit; eslint 0 errors, prettier clean on changed files.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (patch ID + merge SHA + verification); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/no-embed-abstain/verification_matrix.md`

9 of 10 matrix subtasks PASS (unit-testable): no-embed prompt includes the sentinel + "Si tu ne peux pas accéder au contenu réel" and carries the summary format; no VÉRIFICATION/identifié language in the no-meta path; meta=null byte-identical to omitted meta; the updated byte-identical test + the new abstain-path test both green; meta-present path unchanged; one sentinel reused; npm test 86/86 (+1); eslint 0 errors; prettier clean. The 1 remaining — issue lifecycle — is merge-time (comment precedes `rad issue state --solved`). Prompt-side abstention RELIABILITY stays prompt-dependent and lives in eval issue dbf02a1 — not reproducible from the local checkout (no Hermes CLI).

# Task: retire-watchdog
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: c226bf1 — Supervise or retire the bash watchdog (pm2 startup systemd) — it is itself unsupervised

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Retire the bash watchdog by DELETING `hermes_watchdog.sh` + `start_after_reboot.sh`, and rewrite the README "After a reboot" / "Automatic recovery" sections + the CONTEXT "The harness" line to the honest recovery model: PM2 restarts the bot on crash; a container restart/recreate needs one manual `./manage_hermes.sh start` because the managed sandbox exposes no boot hook we control. I will NOT add a `resurrect` subcommand, a boot script, a systemd/upstart unit, pm2-logrotate, or any change to manage_hermes.sh / package.json / the bot's .js.
- **Scope Boundaries:**
  - In-scope: hermes_watchdog.sh (delete), start_after_reboot.sh (delete), README.md, CONTEXT.md
  - Out-of-scope: manage_hermes.sh, package.json, all .js modules, the entrypoint /app/u4s-hermes-agent, test/, evals/

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only what the decision needs — delete the two ops scripts + fix exactly the docs that named them; the stale `NON_ARTICLE_PATTERN` in CONTEXT.md is left for its own change).
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no new resurrect subcommand / boot script / supervision object — the fix is pure subtraction).

### Assumptions
`.artifacts/retire-watchdog/pre_computation_block.md`

*(6 assumptions, all HIGH, each backed by an on-VPS verification: PID 1 = tini, no systemd, a real recreate `d715964579bc`→`8100849eb114` left the bot down with the PM2 daemon absent, and the watchdog log was 11 days stale.)*

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment exactly: `hermes_watchdog.sh` (−46) and `start_after_reboot.sh` (−22) deleted; README's "After a reboot" + "Automatic recovery" rewritten to PM2-crash-restart + manual `./manage_hermes.sh start` + the no-boot-hook reality, with the two scripts dropped from the project tree and the "Watchdog silent" troubleshooting row / watchdog watch-point / watchdog-log maintenance line replaced; CONTEXT.md "The harness" glossary line corrected to PM2 + dotenvx. Zero new logical LOC — the best fix was removal. No `resurrect` subcommand, no boot script, no systemd unit, no pm2-logrotate, no manage_hermes.sh/package.json/.js change — all abstained. The empirical basis (real recreate → bot down, no auto-recovery) was proven on the box, correcting an earlier false-positive that a soft "restart" — which never cycled the PM2 daemon (bot uptime stayed continuous) — had suggested.

### Violation Checklist
- [ ] **Complexity Creep** — 0 new logical LOC; 68 bash lines deleted; no new script/subcommand/knob/unit. Every tempting addition (resurrect verb, boot hook, logrotate) explicitly abstained.
- [ ] **Scope Bleed** — only the 4 declared files changed (+ artifacts/SESSION_LOG/METRICS). manage_hermes.sh, package.json, all .js untouched; the pre-existing prettier dirt and the stale `NON_ARTICLE_PATTERN` line left as orthogonal.
- [ ] **Style Drift** — added README table row matches the existing unpadded style; README/CONTEXT were already prettier-dirty on HEAD and left untouched (config.js precedent); eslint 0 errors; npm test 86/86.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (patch ID + merge SHA + verification + the retire-vs-supervise decision + the two environment-blocked ACs); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/retire-watchdog/verification_matrix.md`

9 of 11 matrix subtasks PASS: both scripts staged-deleted; no dangling references except the intentional README retirement note; both README recovery sections rewritten around `./manage_hermes.sh start`; project tree + troubleshooting + watch-point + maintenance lines fixed; CONTEXT harness line corrected; `bash -n manage_hermes.sh` OK (untouched); npm test 86/86, eslint 0 errors. The 2 PENDING (decision recorded; issue lifecycle) are merge-time — the lifecycle comment precedes `rad issue state --solved`. Note: the issue's own AC1 (auto-boot after reboot) and AC2 (auto-restart the supervisor) are ENVIRONMENT-BLOCKED — unreachable in a managed sandbox with no controllable boot hook (proven on the VPS); recorded as a finding, not silently dropped.

# Task: stale-doc-refs
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: 06e0595 — docs: fix stale CONTEXT/CLAUDE refs — -Q parsing, 📝-reaction summaries, deleted denylist

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Correct exactly the four verified-stale claims in place — CONTEXT.md "Link summary" (📝-reaction opt-in on ANY link, no denylist) + rename "Banner parsing" → "Output parsing (`-Q`)"; CLAUDE.md summary line, CLI-wrapper bullet (`-Q` + `parseHermesOutput`), and three-flows line (📝-reaction). I will NOT touch any .js (the code is correct — the docs lied), README.md/hermes-discord-bot.md (already accurate), or reformat CONTEXT.md's pre-existing prettier dirt.
- **Scope Boundaries:**
  - In-scope: CONTEXT.md, CLAUDE.md
  - Out-of-scope: all .js, README.md, hermes-discord-bot.md

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (each edit corrects exactly one false statement; the rest of both files untouched; grep-swept for the full extent first so I fix all four, not just the one I noticed).
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` (no restructuring, no code change, no drive-by reformat).

### Assumptions
`.artifacts/stale-doc-refs/pre_computation_block.md`

*(5 assumptions, all HIGH, each code-verified: NON_ARTICLE_PATTERN is a tombstone comment; -Q pushed at hermes-cli.js:95/156; prompts.js:122 says "no ⚕ Hermes banner"; reaction handler at :486; README/hermes-discord-bot.md carry no stale terms.)*

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment exactly: CONTEXT.md "Link summary" reworded to 📝-reaction (`SUMMARY_REACTION`) opt-in on any link with "no host denylist, no auto-summary on post"; "Banner parsing" renamed "Output parsing (`-Q`)" describing `parseHermesOutput` (the sole surviving `⚕ Hermes` mention is the intentional "no banner" negation); CLAUDE.md summary line, CLI-wrapper bullet, and three-flows line corrected to `-Q` + 📝-reaction. 7 insertions / 7 deletions, 2 markdown files, zero code LOC. No .js / README / hermes-discord-bot.md touched; CONTEXT.md prettier dirt left as orthogonal — all abstained.

### Violation Checklist
- [ ] **Complexity Creep** — docs-only; 0 code LOC; corrected exactly the 4 verified-stale claims, no restructuring.
- [ ] **Scope Bleed** — only CONTEXT.md + CLAUDE.md changed (+ artifacts/SESSION_LOG/METRICS). README, hermes-discord-bot.md, all .js untouched.
- [ ] **Style Drift** — new prose matches the existing glossary/bullet style; pre-existing prettier dirt left untouched; npm test 86/86 (no code touched).
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (SHA + verification); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/stale-doc-refs/verification_matrix.md`

8 of 9 matrix subtasks PASS: all four doc spots corrected; grep-sweep confirms no surviving NON_ARTICLE_PATTERN / "auto link-summary" / "article URL" reference; each new statement matches the code (5/5 PCB verifications PASS); .js untouched, npm test 86/86. The 1 PENDING (issue lifecycle) is merge-time — the lifecycle comment precedes `rad issue state --solved`.

# Task: summary-retry-guard
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: 5a8db57 — bug: 📝 summary is marked done before the attempt — a failed summary can't be retried

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Split the one "done" set into `REACTED_MESSAGES` (added only after a successful summary) + a transient `SUMMARISING_MESSAGES` in-flight set (added in the guard, removed in a `finally`); make `summariseLinks` return `true`/`false`; isolate each per-link `summarizeLink` in its own try so one bad link doesn't discard the successes. I will NOT rethrow from `summariseLinks` (keep its silent-fail contract), add a two-state marker/Map (Option A), bound the in-flight set, or touch hermes-cli.js / config.js / the 4 pre-existing empty-catch warnings (cb42d9b).
- **Scope Boundaries:**
  - In-scope: hermes-discord-bot-clean.js
  - Out-of-scope: hermes-cli.js, config.js, prompts.js, text.js, recap.js, cache.js, test/*.test.js

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` (change only the dedup placement + per-link isolation the two ACs need; the summary flow, message text, and 3-link cap stay byte-identical — the fix is a mark-on-success move plus a per-iteration try, nothing else).
- Anti-Pattern avoided: `examples/anti-patterns/bloated-loop.md` (no ghost retry-counter flag, no defensive re-loop — the per-link try just collects successes and remembers the first error for the admin DM).

### Assumptions
`.artifacts/summary-retry-guard/pre_computation_block.md`

*(6 assumptions — 5 HIGH, 1 MEDIUM. All 4 verifications PASS: `summariseLinks` has a single caller (:511), its catch never rethrows, npm test 86/86 baseline, eslint 0 errors / 4 known warnings. The MEDIUM is the design choice that a PARTIAL success counts as done — not retryable — which AC3 permits.)*

## Post-Flight Entry

### Reflex Audit
PASSED. Final diff matches the Pre-Flight commitment exactly: added a transient `SUMMARISING_MESSAGES` Set beside the existing `REACTED_MESSAGES` bounded-FIFO; the handler guard now returns on `REACTED ‖ SUMMARISING`, adds the id to `SUMMARISING` (check-and-set atomic — only sync `extractLinks`+`if` between), and marks done via `rememberReaction` ONLY when `summariseLinks` returns truthy, in a `try/finally` that always drains the in-flight id; `summariseLinks` now isolates each `summarizeLink` in its own try (logging + keeping the first error), throws only if EVERY link failed, and returns `true`/`false` so the caller can tell success from failure. 14 net logical LOC = Target (delta 0%). Abstained: the two-state Map/marker (Option A), a rethrow-and-recatch, retry-failed-links-only, a FIFO bound on the in-flight set, and an admin DM on partial failure. No hermes-cli.js / config.js / test / other-file touch; the 4 pre-existing empty-catch warnings (cb42d9b) left alone.

### Violation Checklist
- [ ] **Complexity Creep** — 14 net logical LOC = Target (0%); one Set + one per-link try + a boolean return. No state machine, no retry counter, no knob — all abstained.
- [ ] **Scope Bleed** — only `hermes-discord-bot-clean.js` changed (+ artifacts/SESSION_LOG/METRICS). hermes-cli.js, config.js, prompts.js, the tests, cb42d9b's warnings all untouched.
- [ ] **Style Drift** — mirrors the existing bounded-set + try/catch idiom; eslint exit 0 (4 pre-existing warnings unchanged, 0 new — `catch (err)` consumes `err`); prettier clean on the changed file.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (patch ID + merge SHA + verification + the 3 ACs); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/summary-retry-guard/verification_matrix.md`

9 of 10 matrix subtasks PASS; the 1 PENDING (issue lifecycle) is merge-time — the lifecycle comment precedes `rad issue state --solved`. AC1/AC2/AC3 are exercised by an executable model (`scratchpad/guard-model.mjs`) that faithfully transcribes the guard + `summariseLinks` control flow — the entrypoint hosts the handler with no `module.exports` + `client.login` at load, so it is not live-drivable here (extracting the guard into a testable module is a separate testability refactor, logged as orthogonal). Model asserts all pass: (AC1) a `false` result leaves the id un-remembered → the re-reaction retries and posts; (AC2) two concurrent reactions with an in-flight summary → exactly one `summariseLinks` call; (AC3) a middle-link throw posts only the 2 successes and marks done, while all-links-fail posts nothing and stays retryable. Static checks: `summariseLinks` single caller; catch body byte-identical + `return false` appended; npm test 86/86; eslint 0 errors / 4 unchanged warnings; prettier clean.


---

# Task: reaction-lifecycle
complexity_score: 3
complexity_tier: STANDARD

Radicle issue: ffed210 — bug: 📝 reaction lifecycle — reliable 👀 removal, ✅/⚠️/❌ outcome, drop 📝 to re-arm retry

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Turn `finalizeReaction(message, success)` into `finalizeReaction(message, resultEmoji)` — a dumb helper that hydrates the cache only if empty (`message.fetch()`), sweeps every `r.me` reaction (👀 + any stale ✅/⚠️/❌), then adds the passed emoji. Update the 6 call sites to pass explicit emoji; detect abstention in `summariseLinks` (`abstained ? '⚠️' : '✅'`, all summaries === `messagesFR.linkUnreadable`); route its catch through `finalizeReaction(message, '❌')` (deleting the manual `r.me` loop); on a `false` return the handler best-effort drops the triggering 📝 (`reaction.users.remove(user.id)` in `catch {}`). I will NOT add a 3-value return token, named emoji constants, a dual-type (boolean|emoji) `finalizeReaction`, a `.me`-race poll, an abstention admin-DM, or do cb42d9b's empty-catch cleanup; I will not touch hermes-cli.js / config.js / tests.
- **Scope Boundaries:**
  - In-scope: hermes-discord-bot-clean.js
  - Out-of-scope: hermes-cli.js, config.js, prompts.js, text.js, recap.js, cache.js, test/*.test.js

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — the diff matches the ticket: a helper generalisation (boolean→emoji) that *removes* the catch's manual removal loop while satisfying AC1 (reliable 👀 removal) and AC3 (stale-clear) at once; the summary flow, message text, and 3-link cap stay byte-identical.
- Anti-Pattern avoided: `examples/anti-patterns/god-object.md` — `finalizeReaction` stays a single-responsibility helper (sweep-my-reactions + add one emoji), not a while-I'm-here outcome dispatcher.

### Assumptions
`.artifacts/reaction-lifecycle/pre_computation_block.md`

*(6 assumptions — 5 HIGH, 1 MEDIUM. The MEDIUM is the design choice to keep `summariseLinks`'s boolean return: `true` = terminal/not-retryable (real OR abstention), `false` = hard error; the ✅-vs-⚠️ split lives inside `summariseLinks`. Verifications: `linkUnreadable` returned verbatim (hermes-cli.js:187); 6 `finalizeReaction` call sites; `.me` settled seconds post-react; bindingless `catch {}` dodges `no-unused-vars`; baseline npm test 86/86 + eslint 0 errors / 4 warnings.)*

## Post-Flight Entry

### Reflex Audit
PASSED. The final diff matches the Pre-Flight commitment exactly. `finalizeReaction(message, resultEmoji)` now (a) fetches only when the reactions cache is empty, (b) sweeps every `r.me` reaction — reliably removing 👀 on a fetched/older message and clearing any stale ✅/⚠️/❌ from a prior attempt — then (c) adds the passed emoji. The 6 pre-existing call sites pass explicit emoji (`'✅'`/`'❌'`); `summariseLinks` computes `abstained = summaries.every(s => s === messagesFR.linkUnreadable)` and finalizes `abstained ? '⚠️' : '✅'` (still returning `true` — terminal, not retryable), and its catch routes through `finalizeReaction(message, '❌')` (deleting the manual `r.me` removal loop it subsumes). The handler, on a `false` return, best-effort `reaction.users.remove(user.id)` in a bindingless `catch {}` to re-arm the 5a8db57 retry. Abstained: a 3-value return token, named emoji constants, a dual-type `finalizeReaction`, a `.me`-race poll, an abstention admin-DM, and cb42d9b's empty-catch cleanup. Only `hermes-discord-bot-clean.js` changed. One consciously-reverted line: the `pendingMsg.delete()` catch stayed `catch (_)` (its warning belongs to cb42d9b, not this issue).

### Violation Checklist
- [ ] **Complexity Creep** — helper generalisation (boolean→emoji) that *removes* the catch's manual removal loop; the sweep-all-`r.me` behaviour satisfies AC1 + AC3 at once with no state machine, return-token enum, emoji-constant table, or dual-type coercion.
- [ ] **Scope Bleed** — only `hermes-discord-bot-clean.js` changed (+ artifacts/SESSION_LOG/METRICS). hermes-cli.js, config.js, prompts.js, text.js, recap.js, cache.js, tests untouched; the one pendingMsg `catch (_)` warning left for cb42d9b.
- [ ] **Style Drift** — reuses the file's existing `r.me` sweep idiom (formerly in the catch) and inline-emoji style; eslint 0 errors / 1 pre-existing warning (0 new); prettier clean.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved` (patch ID + merge SHA + verification + the 4 ACs); PENDING at write time, lands at merge.

### Verification Results
`.artifacts/reaction-lifecycle/verification_matrix.md`

10 of 11 matrix subtasks PASS; the 1 PENDING (issue lifecycle) is merge-time. AC1–AC4 + terminal-outcome bookkeeping are exercised by an executable model (`scratchpad/reaction-lifecycle-model.mjs`, 17/17 assertions) that transcribes `finalizeReaction` + `summariseLinks` + the handler against mock Discord reactions — the entrypoint has no `module.exports` and calls `client.login` at load, so it is not live-drivable (a testability refactor is a separate concern). Model proves: (AC1) 👀 swept on success/abstain/error, incl. the empty-cache→fetch case the old `cache.get('👀')` missed; (AC2) real→✅, all-abstain→⚠️, all-throw→❌, mixed→✅; (AC3) a retry sweeps the stale ❌ + fresh 👀 → only ✅; (AC4) the triggering 📝 is removed, and a perm-absent `remove` is swallowed without crashing and stays retryable. Static/tooling: 0 boolean `finalizeReaction` args remain; npm test 86/86; eslint 0 errors / 1 pre-existing warning; prettier clean.


---

# Task: d583385-prettierignore
complexity_score: 4
complexity_tier: STANDARD

Radicle issue: d583385 — hygiene: add .prettierignore (records + append-only) and format the drifted source files

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One `.prettierignore` grouping (a) append-only records — `.artifacts/`, `SESSION_LOG.md`, `METRICS.md` — and (b) the vendored `@YackShavingSkill` framework + tool config — `skills/`, `examples/`, `templates/`, `schemas/`, `tools/`, `.serena/`; then a single `prettier --write` over the 11 our-source/doc files (config.js, recap.js, test-token.js, test/{modules,recap}.test.js, evals/{run-recap-eval.js,README.md}, README.md, CONTEXT.md, CLAUDE.md, hermes-discord-bot.md). I will NOT add a `.prettierrc`/rule tuning, reformat vendored or record files, add a pre-commit hook (setup-pre-commit's job), touch any logic/prose, or list `waysofworking.org` (Prettier has no org parser).
- **Scope Boundaries:**
  - In-scope: `.prettierignore` (new) + the 11 drifted our-source/doc files
  - Out-of-scope: `.artifacts/**`, `skills/`, `examples/`, `templates/`, `schemas/`, `tools/`, `.serena/`, and all already-clean source (hermes-discord-bot-clean.js, hermes-cli.js, cache.js, prompts.js, text.js, evals/assertions.js)

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — change only what the ticket needs; the ignore list keeps Prettier away from the 100+ framework records + vendored dirs rather than dragging them into a formatting churn.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no `.prettierrc`, no hook, no rule tuning bolted on "while I'm here".

### Assumptions
`.artifacts/d583385-prettierignore/pre_computation_block.md`

*(6 assumptions — 5 HIGH, 1 MEDIUM. The MEDIUM is that Prettier never processes `waysofworking.org` — it is absent from the `prettier --check .` drift list, so it needs no ignore entry.)*

## Post-Flight Entry

### Reflex Audit
PASSED. Final change matches the Pre-Flight commitment: one `.prettierignore` (append-only records + vendored `@YackShavingSkill` framework + `.serena/`) and a `prettier --write` over exactly the 11 our-source/doc files. No `.prettierrc`, no rule tuning, no pre-commit hook, no vendored/record reformat, no logic/prose edit. Docs verified cosmetic-only (word-token multiset identical; only table padding + `*`→`_` emphasis changed — the style the issue flagged). `waysofworking.org` left out of the ignore (Prettier has no org parser).

### Violation Checklist
- [ ] **Complexity Creep** — 16-line ignore file + a mechanical format pass; nothing added beyond it.
- [ ] **Scope Bleed** — only `.prettierignore` + the 11 files changed; `.artifacts/`, `skills/`, `examples/`, `templates/`, `schemas/`, `tools/`, `.serena/`, and already-clean source untouched.
- [ ] **Style Drift** — the point of the task; `prettier --check .` now clean.
- [ ] **Issue Lifecycle** — comment before `rad issue state --solved`; PENDING at write time, lands at merge.

### Verification Results
`.artifacts/d583385-prettierignore/verification_matrix.md`

8 of 9 matrix subtasks PASS; the 1 PENDING (issue lifecycle) is merge-time. `prettier --check .` clean; `.artifacts/`+vendored dirs show no format diff; docs word-identical (table padding + `*`→`_` emphasis only); all 6 formatted JS files `node --check` clean; npm test 86/86; eslint . 0 problems.


---

# Task: max-turns-cap
complexity_score: 5
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One constant (`MAX_TURNS_LINK = 10`) in config.js, one `--max-turns` pair appended to `summarizeLink`'s argv, and one regex in prompts.js that both drops the `Reached maximum iterations` notice from the parsed response and is exported so the caller can detect a ceiling hit and resolve to the existing `messagesFR.linkUnreadable`. I will NOT change `parseHermesOutput`'s return shape, add a second constant for `askHermes`, make the cap env-overridable, add a retry ladder, introduce a second French message for "truncated", or refactor the argv builder.
- **Scope Boundaries:**
  - In-scope: `config.js`, `prompts.js`, `hermes-cli.js`, `test/prompts.test.js`
  - Out-of-scope: `hermes-discord-bot-clean.js` (the ⚠️ marker already falls out of the existing `abstained` computation), `recap.js`, `text.js`, `cache.js`, `evals/`, `README.md`, `CONTEXT.md`, `CLAUDE.md`

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — the minimum edit at each site; the notice filter mirrors the existing `READING_TRACE` line-filter rather than inventing a new mechanism.
- Anti-Pattern avoided: `examples/anti-patterns/bloated-loop.md` (defensive code for a scenario that isn't real) and `examples/anti-patterns/god-object.md` (resisting turning hermes-cli.js into a general invocation builder while already in there).

### Assumptions
`.artifacts/max-turns-cap/pre_computation_block.md`

*(6 assumptions — 4 HIGH, 1 MEDIUM, 1 LOW. The LOW is that the notice wording is identical on the bot's v0.16.0; it was measured on v0.20.0 only. Mitigated by tolerant matching, and a non-match degrades to today's behaviour rather than to a failure.)*

### Design change forced by measurement
The issue was filed on the premise that `--max-turns` makes a runaway "fail fast" to ❌. Measured directly before coding: exhausting the ceiling exits **0** and emits `⚠️  Reached maximum iterations (N). Requesting summary...` on stdout, followed by a best-effort answer. `parseHermesOutput` returns that control line verbatim (the existing bare-`⚠` skip deliberately spares `⚠️` = U+26A0 + U+FE0F, so it does not catch it). Adding the flag alone would therefore put English control text into a French channel. Scope grew from 2 files to 4 to fix that in the same change, and the user chose abstention over posting a partial summary — consistent with `1b94451` / `de52e4a`.

## Post-Flight Entry

### Reflex Audit
PASSED. The shipped diff matches the Pre-Flight commitment item for item: one constant (`MAX_TURNS_LINK = 10`) in config.js, one `--max-turns` pair appended to `summarizeLink`'s argv, one `MAX_ITERATIONS_NOTICE` regex in prompts.js that both drops the notice line from every flow's parsed response and is exported so `summarizeLink` can abstain on a ceiling hit. `parseHermesOutput`'s `{response, sessionId}` return shape is unchanged, so the three `assert.deepEqual` contracts still hold (the Pre-Computation Block said two; it is three — `:162`, `:173`, `:193`). Every abstained item stayed abstained: no env-overridable cap, no `MAX_TURNS_ASK`, no `maxTurnsHit` field, no retry ladder, no second French message, no argv-builder refactor. `hermes-discord-bot-clean.js` was not touched, as predicted — the ⚠️ marker falls out of the existing `abstained` computation for free.

### Violation Checklist
- [x] **Complexity Creep** — Line-Count Budget FIRED a Simplify Trigger: Target 20, Actual 56 (+180%). Diagnosed and recorded in `.artifacts/max-turns-cap/simplicity_review.md` rather than hidden. Two causes, neither of them added logic: 10 of hermes-cli.js's 20 lines are single-quoted array elements that Prettier exploded when two elements pushed a one-line literal past the print width (semantically +2 elements), and 31 lines are four `test()` blocks against a Target of 9 that could never have held them (6–8 lines per block). Re-planned Target 50, against which Actual is +12%. Cross-checked: every Abstinence List item is still absent from the diff, so the overage is estimation error and formatter behaviour, not disguised creep.
- [ ] **Scope Bleed** — only the 4 declared files changed (+ SESSION_LOG.md/METRICS/.artifacts, declared as process records). The scope grew from the 2 files estimated at filing time to 4, but that growth was declared in the Pre-Flight Scope Boundaries *before* any edit, driven by the pre-coding measurement, so it is a re-plan and not bleed. All Out-of-Bound files untouched.
- [ ] **Style Drift** — the notice filter mirrors the existing `READING_TRACE` line-filter idiom in the same function rather than inventing a mechanism; the abstain early-return sits beside the existing sentinel abstention and reuses `messagesFR.linkUnreadable`. eslint 0 problems; prettier clean.
- [ ] **Issue Lifecycle** — comment precedes `rad issue state --solved`; PENDING at write time, lands at merge.

### Verification Results
`.artifacts/max-turns-cap/verification_matrix.md`

11 of 12 rows PASS; the 1 PENDING (issue lifecycle) is merge-time. The headline result is row 7, driven end to end against the verbatim stdout captured from a real `--max-turns` exhaustion: the predicate fires, the notice never reaches the parsed response, and the string Discord would receive is `messagesFR.linkUnreadable` — the French abstention, with no English control text. Suite 90/90 (was 86, +4 new tests); eslint 0 problems; prettier clean.

### Residual risk carried to handover
The notice wording was captured on **v0.20.0** while the bot runs **v0.16.0** (Pre-Computation assumption 3, LOW confidence). The pattern matches tolerantly — optional `⚠`/`⚠️` prefix, anchored on the English phrase — and a non-match degrades to today's behaviour (a best-effort summary is posted) rather than to a failure. Confirming the 0.16 wording needs one capped run on the VPS; called out in the issue's lifecycle comment.

---

# Task: youtube-transcript
complexity_score: 6
complexity_tier: COMPLEX

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** A new `youtube.js` exporting three functions — `isYouTube(url)` (hostname-set membership via `URL`, not a regex), `vttToText(vtt)` (delete what is not prose: header lines, cue timings, inline `<...>` tags, entities, consecutive duplicates), and `fetchTranscript(url)` (one bounded `execFile` of `yt-dlp` into a temp dir, best subtitle file wins, `null` on any failure). `summarizeLink` awaits it for YouTube URLs and threads the result into `buildLinkPrompt` as a 4th parameter that defaults to `null`. I will NOT add a transcript cache, a retry ladder, cookie/proxy/PO-token plumbing, a `VideoProvider` abstraction, a `Transcript` class, speaker diarisation, timestamp preservation, a runtime-configurable language list, or a `--js-runtimes` detection probe. The abstain gate, the `--max-turns` cap-abstention, and `summarizeLink`'s existing `execFile` body are preserved verbatim — the body moves into a helper, it is not rewritten.
- **Scope Boundaries:**
  - In-scope: `youtube.js` (new), `config.js`, `prompts.js`, `hermes-cli.js`, `test/youtube.test.js` (new), `test/prompts.test.js`
  - Out-of-scope: `hermes-discord-bot-clean.js` (the change lives behind the `summarizeLink` boundary), `text.js` (tempting home for `isYouTube`, declined — it would import this concern into the mention/recap flows), `recap.js`, `cache.js` (transcript caching explicitly declined as YAGNI), `evals/`, `manage_hermes.sh`, `README.md`, `package.json` (no npm dependency — `yt-dlp` is an external binary via `execFile`, like `hermes`)

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — additive change behind one existing function boundary, with the pre-existing abstain/anchor logic relocated verbatim rather than rewritten. Secondary: `examples/patterns/minimal-scaffold.md` for `youtube.js` (three exported functions, no class, no options object, no plugin seam).
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — the failure mode is shipping a "media extraction subsystem" (provider registry + cache + retry policy + cookie/proxy config) to answer one question. Secondary: `examples/anti-patterns/bloated-loop.md` — `vttToText` is one forward pass with a single `previous` variable, not a cue-block state machine.

### Assumptions
`.artifacts/youtube-transcript/pre_computation_block.md`

*(8 assumptions — 5 HIGH, 2 MEDIUM, 1 LOW. Assumptions 1–3 were **measured before coding**, not estimated: a live `yt-dlp` 2026.08.19 spike wrote `cap.en.vtt` (440 B) and `cap.fr-en.vtt` (402 B), confirmed `--js-runtimes node` clears the JS-runtime deprecation warning, and confirmed YouTube auto-translates EN captions to `fr-en` so French grounding needs no translation step. The LOW is assumption 8 — the spike ran from a **residential** IP, while the VPS is a **datacenter** IP that YouTube penalises far more aggressively. It is not resolvable from the dev machine and is carried as deploy-time row 19 of the Verification Matrix. The design fails safe: a blocked fetch returns `null`, which is byte-identical to today's behaviour.)*

### Design note — why yt-dlp and not a transcript library
The spike showed yt-dlp silently falling back to the `visionos` player client to obtain captions. YouTube rotates which client identities require a Proof-of-Origin token; tracking that rotation is the entire value of the dependency. A library that calls `/api/timedtext` directly (or a hand-rolled fetch) breaks on the next rotation. A headless browser was considered and rejected: it addresses client attestation, which is *not* the failure mode a datacenter IP hits.

## Post-Flight Entry

### Reflex Audit
PASSED with one declared design change. The shipped diff matches the Pre-Flight commitment: a new `youtube.js` with exactly the three promised exports (`isYouTube`, `vttToText`, `fetchTranscript`), four new constants in `config.js`, a 4th `transcript` parameter on `buildLinkPrompt` that defaults to `null`, and `summarizeLink` split into an async wrapper plus `runLinkSummary` whose body is the previous body verbatim except for the prompt argument. The abstain gate, the sentinel mapping and the `MAX_ITERATIONS_NOTICE` cap-abstention were not edited — the transcript suppresses the abstention through a prompt instruction, not through changed control flow. All nine Abstinence List items are verifiably absent. `hermes-discord-bot-clean.js` was not touched, as predicted: the change lives entirely behind the `summarizeLink` boundary, and `isYouTube` stayed out of `text.js` as declared.

The one declared change: `SUBTITLE_LANGS` shipped as `fr,en` rather than the planned `fr,fr-en,en`, forced by a measured HTTP 429 during verification. Recorded in `.artifacts/youtube-transcript/simplicity_review.md` §Design change forced by measurement.

### Violation Checklist
- [x] **Complexity Creep** — Line-Count Budget FIRED: Target 130, Actual 250 (+92%). Diagnosed in `.artifacts/youtube-transcript/simplicity_review.md`, not hidden. Two causes, neither of them added logic: ~62 of the 250 lines are one-token-per-line data literals Prettier explodes (host set, replace chain, yt-dlp argv, URL lists, VTT fixture) against a 6-line allowance — the `max-turns-cap` lesson was carried forward but under-sized roughly tenfold; and the 45-line test budget contradicted the same session's Verification Matrix, which fixed 17 unit-testable rows before coding at a repo-prevailing 4–6 lines per block. Re-planned Target 240, against which Actual is +4%. Cross-checked against the Abstinence List: no item appears in the diff, so the overage is estimation error rather than disguised scope. One genuine cut was found and applied (`pickTranscript` rank-and-sort → find-first).
- [ ] **Scope Bleed** — only the 6 declared files changed (+ `SESSION_LOG.md`, `.artifacts/`, `METRICS.md`, declared as process records). Every Out-of-Bound file untouched: `hermes-discord-bot-clean.js`, `text.js`, `recap.js`, `cache.js`, `evals/`, `manage_hermes.sh`, `README.md`, `package.json` (no npm dependency added — yt-dlp is an external binary via `execFile`, like `hermes`).
- [ ] **Style Drift** — `youtube.js` mirrors the existing module idioms: `execFile` not `exec`, bindingless `catch {}` (issue cb42d9b), env-overridable binary path in the `HERMES_BIN` shape, `console.log`/`console.error` progress lines matching `hermes-cli.js`, and the repo's issue-referencing comment density. eslint 0 problems; prettier clean.
- [ ] **Issue Lifecycle** — comment precedes `rad issue state`; PENDING at write time, lands at merge.

### Verification Results
`.artifacts/youtube-transcript/verification_matrix.md`

18 of 20 rows PASS; the 2 PENDING are deploy-time (row 19) and merge-time (row 20). Suite 107/107 (was 90, +17 new tests); eslint 0 problems; prettier clean.

The headline result is row 17, and it is more informative than its PASS suggests. The end-to-end check **failed on its first run** with `HTTP Error 429: Too Many Requests` from a residential IP, after only a handful of caption fetches, and passed on retry after a cooldown. That accident proved row 14's guarantee against a genuine block rather than a synthetic one: yt-dlp hard-failed, `fetchTranscript` returned `null`, the temp directory was still cleaned by the `finally`, nothing threw, and the summary path degraded to the pre-existing embed-anchored behaviour. It also forced the `SUBTITLE_LANGS` change, because the planned three-entry list made yt-dlp download every matching track — two or three requests per video against the one endpoint that rate-limits, of which only one file is ever read.

### Residual risk carried to handover
Assumption 8 remains the open question and is deliberately unresolved: every measurement in this session ran from a **residential** IP, while the bot runs on a **datacenter** IP, which YouTube penalises far more aggressively. Seeing a 429 on the friendlier of the two cases downgrades the outlook rather than improving it; cutting the language list halves the request rate but does not remove the risk. Row 19 is the deploy-time check that settles it, and the issue records the fallback ladder (cookies → PO-token provider → residential proxy → hosted transcript API) if it fails.

The cost of that failure is bounded by design and was measured, not assumed: a permanently blocked fetch is the `null` path, which is byte-identical to the behaviour that shipped before this feature — guarded by the row 9 regression test on both the meta and no-meta prompt branches. The feature is therefore safe to deploy even if row 19 fails outright; it simply would not do anything.

Secondary residual: the caption endpoint is a moving target. yt-dlp was observed falling back to the `visionos` player client to obtain captions, which is exactly the client-rotation behaviour the dependency was chosen for, but it also means the working path today is not guaranteed to be the working path next month. `YTDLP_BIN` on the persisted volume makes updating the binary a file copy rather than an image rebuild.

# Task: reply-chain-sessions
complexity_score: 5
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One Map with two key shapes — `msg:<answerId>` for every answer message the bot posts, and the place key for a thread or DM. An incoming mention resumes the replied-to answer's session, else its thread/DM's, else nothing. 500-entry FIFO cap in the `PROCESSED_MESSAGES` idiom. I will NOT walk the reply chain over REST, key by user, lock per channel, add a TTL/LRU clock, migrate the legacy cache file, or seed sessions from 📝 summaries (issue 576af84).
- **Scope Boundaries:**
  - In-scope: `cache.js`, `text.js` (sendLongResponse return value), `hermes-discord-bot-clean.js` (Q&A session lines only), `test/cache.test.js` (new), `test/modules.test.js`, `test/text.test.js`
  - Out-of-scope: `prompts.js`, `hermes-cli.js`, `recap.js`, `config.js`, `youtube.js`, the link cache, the 📝 summary path, the DM guild-check bug (orthogonal, reported separately)

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — the session lookup is swapped behind the same two call sites; `--resume` plumbing untouched.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no "conversation manager" class, no per-user/TTL/lock layers.

### Assumptions
`.artifacts/reply-chain-sessions/pre_computation_block.md`

*(6 assumptions — 5 HIGH, 1 MEDIUM: the 500 cap. Design refinement recorded vs the issue text: threads and DMs also resume by place, because people type follow-ups there without Discord's reply button.)*

## Post-Flight Entry

### Reflex Audit
PASSED. The diff is the Pre-Flight Simplicity Goal and nothing more: one `sessions` Map with two key shapes (`msg:<answerId>` and a thread/DM place key), `findSessionId` (reply first, then place, else a fresh chain), `recordSession` (every posted chunk + the place it landed in), and a 500-entry FIFO cap in the `PROCESSED_MESSAGES` idiom. `sendLongResponse` now resolves to the posted messages — its two chunk loops collapsed into one on the way. The bot's Q&A path swapped key/get/set for one lookup and one record, and records AFTER posting (assumption 6). All Abstinence List items are absent: no REST chain walk, no per-user keys, no lock, no TTL, no cache migration, no 📝 seeding.

### Violation Checklist
- [x] **Complexity Creep** — Line-Count Budget FIRED: Target 90, Actual 123 net (+37%). Source is +12 net, under its allowance; the overage is test sizing — 10 matrix rows were fixed before coding but the budget sized ~7, and omitted ~20 lines of shared duck-typed fixtures. Re-planned Target 125, Actual −2%. Diagnosed in `.artifacts/reply-chain-sessions/simplicity_review.md`.
- [ ] **Scope Bleed** — none. Two doc files (`CONTEXT.md` Session glossary, `hermes-discord-bot.md`) added as a declared Post-Flight Touch List addition: both still said sessions were "cached per channel/thread". Every Out-of-Bound file untouched.
- [ ] **Style Drift** — none. eslint 0 problems; prettier clean.
- [ ] **Issue Lifecycle** — PENDING, lands at merge (comment precedes `rad issue state`).

### Verification Results
`.artifacts/reply-chain-sessions/verification_matrix.md`

9 of 11 rows PASS; 2 PENDING (deploy-time live Discord check, merge-time lifecycle comment). Suite 117/117 (was 107, +10 new: 7 in `test/cache.test.js`, 3 in `test/text.test.js`).

### Residual risk carried to handover
- **DMs are broken independently of this task.** `message.channel.type === 'DM'` compares a discord.js v13 string against the v14 numeric `ChannelType.DM` (verified `=== 1`), so `isDirectMessage` is always false and a DM throws at `message.guild.id`. The DM branch of `placeKey` is correct but unreachable until that is fixed — reported to the user as a separate issue.
- Legacy plain-channel keys in `.session_cache.json` on the VPS are never read again; they sit at the old end of the FIFO and are evicted as new answers are recorded. Legacy thread keys share the new format and keep resuming.
- A reply to an answer posted before the deploy starts fresh (no `msg:` key exists for it) — one-time, expected.

# Task: summary-questions
complexity_score: 5
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** Prompt asks for `1. **Titre** :` points and numbered questions (fitting unwrapText's existing markers); a pure `splitQuestions` cuts the questions off each summary, null on anything unexpected; the bot posts each question as a `❓` reply and records the summary's own Hermes session on it with 244bad7's `recordSession`; a reply to a `❓` message is prefixed with its question. I will NOT walk the reply chain, store question text, change unwrapText, request JSON from Hermes, add a reaction trigger, or build a link eval runner.
- **Scope Boundaries:**
  - In-scope: `prompts.js`, `hermes-cli.js`, `hermes-discord-bot-clean.js`, `test/prompts.test.js`, `CONTEXT.md`
  - Out-of-scope: `text.js`, `cache.js`, `evals/`, `recap.js`, `config.js`, `youtube.js`

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — reuse recordSession and the reply-resume path from 244bad7 instead of a second mechanism.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no question store, no JSON protocol, no reaction layer.

### Assumptions
`.artifacts/summary-questions/pre_computation_block.md`

*(7 assumptions — 5 HIGH, 2 MEDIUM: `--resume` on a `--max-turns` link session, and model format compliance. Both only verifiable live; the parser falls back to today's output, so a miss degrades to current behaviour.)*

## Post-Flight Entry

### Reflex Audit
PASSED. The diff is the Pre-Flight goal: a digit-first numbered format, a pure `splitQuestions` that returns null on anything but 2+ numbered question lines, `summarizeLink` returning `{ summary, sessionId }`, a best-effort `postQuestions` that posts `❓` replies and records the summary's session with 244bad7's `recordSession`, and a reply-to-question prefix. Both summary paths (📝 and @mentioned link) split. A reply to a question also skips the "latest link in this channel" hint, which could name a different article than the resumed session's. No reply-chain walk, no question store, no unwrapText change, no JSON protocol.

### Violation Checklist
- [ ] **Complexity Creep** — 177 net vs 150 (+18%), under the trigger. Diagnosed in simplicity_review.md.
- [ ] **Scope Bleed** — none; CONTEXT.md table re-padded by prettier (whitespace only).
- [ ] **Style Drift** — none.
- [ ] **Issue Lifecycle** — PENDING, lands at merge.

### Verification Results
`.artifacts/summary-questions/verification_matrix.md`

7 of 10 rows PASS; 3 PENDING (2 live Discord checks at deploy, lifecycle at merge). Suite 124/124 (+7). A scratchpad run of the real `unwrapText` on the old bold-first output reproduced the screenshot bug exactly (`**Points clés** : **1. Performances**` glued onto one line), which confirms assumption 4. The same run showed the parser still splits when unwrapText glues the header onto the previous line.

### Residual risk carried to handover
- Model compliance with the new format is only verifiable live (no link eval runner; local Hermes 0.20 can't reach Mistral, 1ae5380). Miss = today's single message.
- `--resume` on a `--max-turns` link session is assumed, not observed (assumption 3). If it fails, askHermes errors and the member gets the generic error reply; the admin DM will show it.
- The @mention path still carries buildAskPrompt's "paragraphes continus" line ahead of the format; plain Q&A must stay byte-identical, so it was not touched.

# Task: gateway-autostart
complexity_score: 5
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** A two-file Hermes gateway hook on `gateway:startup` that spawns the existing `manage_hermes.sh start`, detached, with every `HERMES_*` variable stripped; an idempotent `start`; an `install-hook` symlink into `/data/hooks`. I will NOT add a watchdog, retries, polling cron, alerting, or any logic in the Python shim beyond spawning the script.
- **Scope Boundaries:**
  - In-scope: `ops/hermes-hooks/start-discord-bot/HOOK.yaml`, `ops/hermes-hooks/start-discord-bot/handler.py`, `manage_hermes.sh`, `README.md`
  - Out-of-scope: every `*.js` file, `test/`, `evals/`, `package.json`

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/minimal-scaffold.md` — two small files, no framework, reuse the existing start script.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no supervisor, no alerting stack, no retry policy.

### Assumptions
`.artifacts/gateway-autostart/pre_computation_block.md`

*(7 assumptions — 5 HIGH, 2 MEDIUM: symlinked hook dirs and `pm2 pid` output, both checked on the VPS at install time. Headline: the hook child inherits HERMES_HOME=/data from the gateway, which would silently break the bot's hermes 0.16 calls — stripped by design. Python handler is required by the Hermes hook contract; kept to a shim.)*

## Post-Flight Entry

### Reflex Audit
PASSED. Shipped exactly the goal: `HOOK.yaml` on `gateway:startup`, a `handler.py` shim that spawns `manage_hermes.sh start` detached with every `HERMES_*` variable stripped, an idempotent `start` (early exit when `pm2 pid` is positive; `cd` moved first so `npx pm2` resolves the local pm2), an `install-hook` symlink into `/data/hooks`, and a rewritten reboot runbook. No watchdog, retry, cron or alerting.

### Violation Checklist
- [x] **Complexity Creep** — Line-Count Budget FIRED: 74 vs 45 (+64%). Executable ~28 lines; the rest is comments and README prose documenting the two-Hermes-homes trap. Diagnosed in simplicity_review.md.
- [ ] **Scope Bleed** — none.
- [ ] **Style Drift** — none.
- [ ] **Issue Lifecycle** — PENDING, lands at merge.

### Verification Results
`.artifacts/gateway-autostart/verification_matrix.md`

2 PASS, 1 PARTIAL, 5 PENDING. The handler was not dry-run locally: that would mean authoring Python, which the user's global rules forbid. It is exercised on the VPS by calling the existing handler file, then for real at the next container recreate.

### Residual risk carried to handover
- The full chain (recreate → gateway → hook → PM2 → bot) is only provable at the next recreate.
- Assumption 5 (symlinked hook dir is discovered) — if the recreate shows no `.autostart.log` entry, switch `install-hook` from `ln -sfn` to a copy.
- A gateway crash-restart fires the hook again; idempotent `start` makes that a logged no-op.

## Post-Flight Correction (gateway-autostart, after VPS test)
Assumption 4 was wrong in its reasoning, not in its conclusion. The bot does NOT use `/data/.hermes`: its encrypted `.env` sets `HERMES_HOME` (injected by dotenvx), and its profile lives at `/data/profiles/discord-bot` — verified on the VPS. Only the interactive shell (no `HERMES_HOME`) uses `/data/.hermes`. Stripping `HERMES_*` in the handler is still correct: dotenvx does not override variables already set, so the strip lets `.env` decide, and it keeps `HERMES_WEBUI_PASSWORD` out of the bot. The VPS test's `grep -c '^HERMES_HOME='` = 1 is therefore expected (it comes from `.env`); the meaningful check is that `HERMES_WEBUI_PASSWORD` is absent after a clean (`pm2 delete`) hook start. Comments in handler.py, manage_hermes.sh and the README note corrected.

# Task: summary-always-thread
complexity_score: 4
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One `postInThread` helper in `text.js` (thread/DM → post there; existing message thread → post there; else start one; a text that fits is ONE message), reused by `sendLongResponse`; `summariseLinks` edits in place only in a thread/DM and otherwise always threads; the thread also gets the cached link. ADR 0001 records the decision. I will NOT touch the @mention Q&A path, the splitter's per-paragraph chunking, or move the placeholder into the thread.
- **Scope Boundaries:**
  - In-scope: `text.js`, `hermes-discord-bot-clean.js`, `test/text.test.js`, `test/modules.test.js`, `docs/adr/0001-link-summaries-always-in-a-thread.md`, `CONTEXT.md`
  - Out-of-scope: `cache.js`, `prompts.js`, `hermes-cli.js`, `recap.js`, `config.js`, `evals/`

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — extract the thread-target logic sendLongResponse already has into one helper; the summary flow calls it instead of growing its own.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no per-guild "thread mode" setting, no thread-archive tuning, no placeholder-in-thread choreography.

### Assumptions
`.artifacts/summary-always-thread/pre_computation_block.md`

*(4 assumptions, all HIGH — discord.js `startThread` throws on a message with a thread and `message.thread` is cache-only; the splitter cuts at every blank line; questions follow `lastPosted` into the thread; the bot already has thread permission.)*

## Post-Flight Entry

### Reflex Audit
PASSED. Shipped the goal: `postInThread` in `text.js` (thread/DM → post there; existing thread on the message → reuse, cached or fetched by id; else start one; text that fits = one message), `sendLongResponse` delegates its long case to it, `summariseLinks` edits in place only in a thread/DM with a fitting summary and otherwise always threads, and caches the link on the thread too. ADR 0001 and the CONTEXT.md glossary line record the decision. @mention Q&A, splitter chunking, and placeholder placement untouched.

### Violation Checklist
- [x] **Complexity Creep** — Line-Count Budget FIRED: 118 vs 60 (+97%); production +18 net, the rest tests + the requested ADR. Diagnosed in simplicity_review.md.
- [ ] **Scope Bleed** — none; CONTEXT.md table re-padded by prettier (whitespace only).
- [ ] **Style Drift** — none.
- [ ] **Issue Lifecycle** — PENDING, lands at merge.

### Verification Results
`.artifacts/summary-always-thread/verification_matrix.md`

6 PASS, 3 PENDING (2 live Discord checks, lifecycle at merge). Suite 130/130 (+5). `summariseLinks` is not unit-testable (lives in the entrypoint); its branch is covered through `postInThread` + the live row.

### Residual risk carried to handover
- A long summary in a thread still posts one message per paragraph (splitter cuts at every blank line) — pre-existing, now more visible; separate issue if it bothers members.
- Side effect: `sendLongResponse` (long @mention answers) no longer throws when the message already has a thread — it reuses it. Strictly a fix.

# Task: hermes-profile
complexity_score: 4
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** One `HERMES_PROFILE` constant in `config.js` (env, default `discord-bot`) replacing the two hard-coded `-p discord-bot` in `hermes-cli.js` and the one in the recap eval; one env-override test; a README cutover/rollback runbook. I will NOT add profile validation, a startup probe, per-flow profiles, or touch the unmerged 9afaeac probe.
- **Scope Boundaries:**
  - In-scope: `config.js`, `hermes-cli.js`, `evals/run-recap-eval.js`, `test/modules.test.js`, `README.md`
  - Out-of-scope: `hermes-discord-bot-clean.js`, `prompts.js`, `cache.js`, `manage_hermes.sh`, `ops/`

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — mirror the existing env-overridable `HERMES_BIN` shape (issue df0d693) exactly.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no profile registry, no per-flow routing, no auto-detection.

### Assumptions
`.artifacts/hermes-profile/pre_computation_block.md`

*(3 assumptions, all HIGH: an unset var keeps today's argv; the gateway hook strips HERMES_* so the vars must live in the encrypted .env; sessions do not carry across profiles, so the cutover clears .session_cache.json.)*

## Post-Flight Entry

### Reflex Audit
PASSED. `HERMES_PROFILE` in config.js (default `discord-bot`), substituted at both hermes-cli.js `-p` sites and threaded through the recap eval; one override test; README §Switching the Hermes version (cutover + rollback, set via `dotenvx set` because the hook strips inherited `HERMES_*`, clear `.session_cache.json`). Stub-binary capture confirms the unset argv is unchanged.

### Violation Checklist
- [ ] **Complexity Creep** — 76 vs 70 (+9%); budget fixed at Post-Flight (process miss).
- [x] **Scope Bleed** — `evals/README.md` (+1 line documenting the eval override) was not declared; it documents the in-scope eval change.
- [ ] **Style Drift** — none; mirrors the HERMES_BIN shape.
- [ ] **Issue Lifecycle** — PENDING, lands at merge.

### Verification Results
`.artifacts/hermes-profile/verification_matrix.md`

5 PASS, 2 PENDING. Suite 131/131 (+1).

### Residual risk carried to handover
- The cutover itself is still gated by the epic's remaining checks (recap eval + a real 📝 run on discord-bot-021).
- `evals/run-recap-eval.js` defaults `HERMES_BIN` to `hermes` on PATH (unchanged) — on the VPS that is 0.21; pass HERMES_BIN explicitly for a 0.16 baseline.

# Task: delete-thread-notice
complexity_score: 4
complexity_tier: STANDARD

## Pre-Flight Entry

### Reflex Check
- **Simplicity Goal:** A pure `isOwnThreadNotice(message, botId)` in `text.js` (type ThreadCreated AND author = the bot) and, at the top of `messageCreate` before the bot-author return, a best-effort `delete()` of such a message; ADR 0001 gains one consequence line. I will NOT fetch channel history after startThread, touch members' notices, or add a config switch.
- **Scope Boundaries:**
  - In-scope: `text.js`, `hermes-discord-bot-clean.js`, `test/text.test.js`, `docs/adr/0001-link-summaries-always-in-a-thread.md`
  - Out-of-scope: `prompts.js`, `cache.js`, `hermes-cli.js`, `config.js`, the intents list

### Simplicity Strategy
MINIMAL

### Contextual Retrieval
- Gold Standard referenced: `examples/patterns/surgical-diff.md` — one predicate + one early branch in the existing handler, same best-effort `catch` shape as finalizeReaction.
- Anti-Pattern avoided: `examples/anti-patterns/kitchen-sink-scaffold.md` — no history scan, no retry, no per-channel setting.

### Assumptions
`.artifacts/delete-thread-notice/pre_computation_block.md`

*(3 assumptions: the notice arrives as messageCreate with author = the thread's creator (HIGH, Discord docs); GuildMessages intent already covers it (HIGH); the bot's Manage Messages covers deleting system messages (MEDIUM — verified only live; failure is logged, harmless).)*

## Post-Flight Entry

### Reflex Audit
PASSED. `isOwnThreadNotice` in text.js (ThreadCreated AND author = bot), a best-effort delete at the top of `messageCreate` before the bot-author return, one test covering own/member/normal/null-author, ADR 0001 consequence line. No history fetch, retry or setting.

### Violation Checklist
- [x] **Complexity Creep** — 38 vs 30 (+27%), marginal; comments + prettier split. Diagnosed in simplicity_review.md. Budget fixed at Post-Flight.
- [ ] **Scope Bleed** — none.
- [ ] **Style Drift** — none; French console.error like its neighbours.
- [ ] **Issue Lifecycle** — PENDING, lands at merge.

### Verification Results
`.artifacts/delete-thread-notice/verification_matrix.md`

5 PASS, 2 PENDING. Suite 135/135 (+1).

### Residual risk carried to handover
- Assumption 3 (Manage Messages covers system messages) is only provable live; a miss logs "Suppression de la notice de fil échouée" and leaves today's behaviour.
- Also removes the notice for recap and long-answer threads when their starter message isn't the latest — consistent with ADR 0001.
