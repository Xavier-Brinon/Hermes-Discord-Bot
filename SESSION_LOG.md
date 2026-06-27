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
