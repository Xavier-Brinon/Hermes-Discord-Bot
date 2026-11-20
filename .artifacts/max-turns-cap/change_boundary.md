---
artifact_type: change_boundary
task_id: max-turns-cap
timestamp: 2026-08-13T14:41:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
|------|-----|----------------------|
| `config.js` | Hold `MAX_TURNS_LINK` as a named constant and export it (AC2 forbids a literal in argv) | modify |
| `prompts.js` | Add `MAX_ITERATIONS_NOTICE`; drop the notice line from the parsed response; export the pattern for caller-side detection | modify |
| `hermes-cli.js` | Pass `--max-turns` in `summarizeLink`'s argv; resolve a ceiling hit to `messagesFR.linkUnreadable` | modify |
| `test/prompts.test.js` | Cover the notice filter, the tolerant prefix, and non-matching of a real French answer | modify |
| `.artifacts/max-turns-cap/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/max-turns-cap/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/max-turns-cap/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/max-turns-cap/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/max-turns-cap/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List

- `hermes-discord-bot-clean.js` — the ⚠️ marker already falls out of the existing
  `abstained = summaries.every(s => s === messagesFR.linkUnreadable)` computation in
  `summariseLinks`. No edit is needed, and editing it to "make the abstention explicit" would be
  scope bleed on the entrypoint.
- `recap.js` — has its own `TIMEOUT_RECAP`; not the runaway path this issue describes.
- `text.js`, `cache.js` — unrelated concerns.
- `evals/` — steers prompt wording; this change touches argv and parsing only.
- `README.md`, `CONTEXT.md`, `CLAUDE.md` — no operator-visible behaviour change to document. The
  user-visible change (⚠️ instead of a thin summary) is a refinement of an already-documented
  abstention.
*(Note: `SESSION_LOG.md`, `METRICS.md` and this task's `.artifacts/` files were initially listed
here as out-of-bound. That was a misreading of the convention — this repo declares process records
in the File Touch List, as `reaction-lifecycle` does, because they genuinely do change in the
commit. Corrected before the Review Gate ran; the code scope is unaffected.)*

## Creation Order

Not applicable — all four files already exist and can be edited in any order.

## Orthogonal Issues (noticed, skipped)

- **`hermes-cli.js` builds argv with positional `splice` indices** (`args.splice(sessionId ? 4 : 2,
  0, '-t', 'web')`) that shift depending on prior insertions. Fragile, and it will bite the next
  flag added. Not now: it touches all three flows and deserves its own issue. This change
  deliberately *appends* after the subcommand to avoid the arithmetic entirely.
- **`askHermes` runs uncapped at Hermes's default 90 turns.** Same latency exposure, but no
  abstain path to route a ceiling hit into. Deferred; would need a product decision about what a
  truncated answer should say.
- **`summarizeLink` and `askHermes` duplicate their `execFile` error handling** nearly verbatim.
  Extraction is a refactor, not this fix.

## Orphan Tracking

- None expected. The change is additive at every site: one new constant, one new regex, one new
  export, one new argv pair, one new early return. Nothing is superseded or left unreferenced.
- Verified after coding with `npx eslint .` (the repo's `no-unused-vars` rule is the orphan check
  named in `skills/surgical.md` §Orphan detection).

## Discipline references

- Gold Standard: `examples/patterns/surgical-diff.md` — the minimum edit at each site.
- Anti-Pattern explicitly avoided: `examples/anti-patterns/god-object.md` — resisting the pull to
  turn `hermes-cli.js` into a general Hermes-invocation builder with an options object per flow
  while "already in there".
