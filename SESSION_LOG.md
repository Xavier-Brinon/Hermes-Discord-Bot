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
