---
artifact_type: simplicity_review
task_id: prompt-eval-harness
timestamp: 2026-06-24T17:08:48Z
complexity_score: 5
complexity_tier: STANDARD
---

## Simplest Possible Solution

Move the three prompt strings and the `THEME:` parser verbatim into `prompts.js`,
have the bot import them (no behaviour change), and add a small `evals/` harness:
fixtures of channel history, an assertions module that reuses `extractThemes`,
and a runner that invokes `hermes -p discord-bot` with the bot's exact args N
times per fixture and prints a THEME-format compliance rate. A/B steering is just
"point the runner at a different prompt file and compare rates."

## Abstinence List (not added, intentional)
- **A shared "French style" sub-constant** across prompts — would risk byte drift
  and is premature abstraction; verbatim per-function literals instead.
- **An eval framework / dependency** (jest, vitest, promptfoo) — `node:test` +
  plain scripts are dependency-free and match the repo's no-extra-deps posture.
- **A built-in LLM-as-judge** — documented as an optional layer in the README,
  not coded now (needs a second model call; recap's format check is the priority).
- **Link + Q&A eval runners** — assertions.js stays general; runners deferred.
- **Re-implementing the Hermes output parser in the eval** — deferred to dcdec9e;
  eval approximates the `-Q` path with a comment.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     90 |    145 | +61%  |

(Net logical LOC: 160 new across prompts.js 33 / assertions 26 / runner 62 / test 39,
minus 17 from the bot (extraction removed more than it added), +2 package.json.
Counted via `grep -vE '^\s*(//|$)'`.)

## Anti-Pattern contrasted
- `examples/anti-patterns/kitchen-sink-scaffold.md` — avoided building a generic
  multi-prompt eval framework up front; built the one runner the request needs.

## Simplify Triggers (detected)
- **Budget breach (+61% vs Target 90) — recorded, not hidden.** Cause: the Target
  under-estimated *irreducible* scaffolding — the eval runner I/O (62 LOC:
  arg-parse, fixture read, N-run loop, table) and the test file (39 LOC). The
  *solution* stayed minimal: prompts.js is 33 LOC of verbatim extraction and the
  bot shrank by 17. Nothing on the Abstinence List was added, so this is
  estimation error on test + I/O lines, not Complexity Creep. Realistic Target for
  "extraction + test + eval harness" ≈ 150.
