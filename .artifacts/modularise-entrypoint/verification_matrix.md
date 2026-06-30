---
artifact_type: verification_matrix
task_id: modularise-entrypoint
timestamp: 2026-06-30T17:08:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| All modules compile | config/hermes-cli/cache/text/recap + entrypoint pass syntax | `node --check` each → PASS (6/6) |
| Acyclic module graph | each module requires in isolation without error or cycle | test/modules.test.js → PASS (requiring hermes-cli pulls config+prompts+text) |
| Exports present | each module exports its declared API | test/modules.test.js asserts → PASS |
| Pure-module tests still pass | text/recap behaviour unchanged | `node --test` → PASS (47: 46 pass / 0 fail / 1 skip; +6 module tests) |
| askHermes options object | both call sites pass `{...}`; positional behaviour preserved | recap: `{extraContext, customTimeout}`; @mention: `{extraContext, useWebTools, sessionId}` → PASS |
| env-overridable paths (df0d693) | `process.env.HERMES_BIN`/`WORKSPACE_DIR` override; defaults = old literals | test/modules.test.js override case → PASS |
| Entry file is wiring only | no business logic except handlers + client + dedup/notify/finalize | entrypoint 748→386 lines; only client/handlers/notifyAdmin/finalizeReaction/dedup remain → PASS |
| No dangling refs | relocated symbols not redefined in entrypoint; path/execFile requires dropped | grep → none; only imports + call sites → PASS |
| Behaviour preserved | recap/@mention/link flows call the same logic; messagesFR intact | handler body verbatim; messagesFR byte-identical to HEAD (deepEqual) → PASS |
| npm run lint | exit 0 on the new module set | `npm run lint` → PASS (exit 0; 4 pre-existing legacy warnings) |
| Issue lifecycle documented | comments before transitions for BOTH 950dc54 and df0d693 | `rad issue show` shows transition comments (at solve) → PENDING (lands at merge) |
