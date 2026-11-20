---
artifact_type: pre_computation_block
task_id: max-turns-cap
timestamp: 2026-08-13T14:41:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Complexity Score

Scope 2 (4 files) + Ambiguity 1 (the turn value is a judgement call) + Risk 2 (user-facing
critical path: too low a cap turns legitimate summaries into abstentions) + Knowledge Gap 0
(all four files read this session) = **5 → STANDARD**.

Scope rose from the 2 files estimated at filing time to 4, because measurement showed the flag
alone would introduce an English-text leak that must be fixed in the same change.

## Assumptions

| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `--max-turns N` is accepted as a chat-subcommand flag on the bot's v0.16.0 | HIGH — present in that binary's own `chat --help`, default 90 |
| 2 | Exhausting the ceiling exits **0** and emits a `Reached maximum iterations` notice on stdout, rather than failing | HIGH — measured directly: `EXIT=0`, line captured verbatim |
| 3 | The notice wording is the same on 0.16 as on 0.20 | **LOW** — measured on 0.20 only; the bot's 0.16 cannot be driven from here |
| 4 | 10 turns is generous for a normal link summary | MEDIUM — not measured; a normal summary is fetch + summarise, roughly 2–4 turns |
| 5 | Returning `messagesFR.linkUnreadable` produces the ⚠️ marker with no entrypoint change | HIGH — `summariseLinks` already computes `abstained = summaries.every(s => s === messagesFR.linkUnreadable)` |
| 6 | The notice filter cannot swallow a real French answer | HIGH — English control phrase, anchored at line start |

Assumption 3 is the LOW-confidence red flag Skill A calls out. It is mitigated rather than
resolved: the pattern matches tolerantly (optional `⚠`/`⚠️` prefix, anchored on the stable English
phrase), and a non-match degrades to today's behaviour (best-effort summary posted) rather than to
a crash. Recorded as residual risk, not as resolved.

## Scope Declaration

### Files in scope
- `config.js` — hold `MAX_TURNS_LINK` as a named constant (AC2 requires a constant, not a literal)
- `prompts.js` — filter the notice line out of the response, and export the pattern so the caller can detect a ceiling hit
- `hermes-cli.js` — pass `--max-turns` in `summarizeLink`; map a ceiling hit to the abstain path
- `test/prompts.test.js` — cover the new filter and the detection pattern

### Files off-limits
- `hermes-discord-bot-clean.js` — no change needed; returning `linkUnreadable` already routes to ⚠️ via the existing `abstained` computation. Touching it would be scope bleed.
- `recap.js` — the recap flow has its own timeout and is not the runaway path described by the issue
- `text.js`, `cache.js` — unrelated concerns
- `evals/` — prompt-quality harness; this change is argv/parsing, not prompt wording
- `README.md`, `CONTEXT.md`, `CLAUDE.md` — no documented behaviour changes for the operator

## Interpretations of the request

- **Literal reading:** "cap iterations so a runaway fails fast", i.e. the cap produces a fast ❌.
  Disproved by measurement — the ceiling exits 0 with a best-effort answer, so nothing fails.
- **Adopted reading:** cap the iterations *and* decide what a truncated run means. Because exit is
  0, the bot must choose between posting a partial summary and abstaining. Confirmed with the user:
  abstain, consistent with `1b94451` / `de52e4a`.

## Alternatives considered

- **Return a `maxTurnsHit` field from `parseHermesOutput`** — rejected: `test/prompts.test.js:161`
  and `:172` assert the exact return object with `assert.deepEqual`, so a new field breaks two
  passing contracts for no expressive gain. One exported regex serves both the filter and the
  detection.
- **Treat a ceiling hit as a hard error (reject → ❌)** — rejected: it is not a transport failure,
  and ❌ re-arms the `5a8db57` retry, so a deterministically-truncating page would be retried
  forever. ⚠️ is terminal and honest.
- **Cap `askHermes` as well** — deferred to the Abstinence List; the issue's AC covers
  `summarizeLink`, and `askHermes` has no abstain path to route a ceiling hit into.
- **Strip the notice only in `summarizeLink`** — rejected: `askHermes` runs at the default 90 and
  can hit the same ceiling, so filtering belongs in the shared parser where both flows benefit.

## Gold Standard cited

`examples/patterns/surgical-diff.md` — change only what solves the problem. The constant, the
filter, and the argv flag are each the minimum edit at their site; no signature redesign, no
refactor of the argv builder, no doc churn.
