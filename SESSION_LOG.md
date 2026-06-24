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
