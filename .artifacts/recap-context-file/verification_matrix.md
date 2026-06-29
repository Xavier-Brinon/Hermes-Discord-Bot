---
artifact_type: verification_matrix
task_id: recap-context-file
timestamp: 2026-06-28T11:14:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| Builder shape | `buildAskPromptWithContextFile(q, ref)` contains the French instruction, the question, and ` @file:<ref>` | `test/prompts.test.js` 2 new cases → PASS |
| No regression in prompts | existing builder/parser tests still pass | `node --test test/*.test.js` → PASS (19 pass / 0 fail; 17 prior + 2 new) |
| Bot parses | bot + prompts compile | `node --check` on both → PASS |
| Small prompt stays on argv | a normal @mention prompt (< threshold) produces no temp file and inline context | offload harness A: small input → no file, inline `Contexte :` → PASS |
| Large prompt offloads | a > threshold prompt writes a temp `.txt` under cwd and `-q` becomes small with `@file:<basename>` | offload harness B: 148504 B inline → argv 263 B + `@file:` ref → PASS |
| Temp file under cwd | offloaded file path is inside `process.cwd()` (Hermes `allowed_root`) | harness B asserts `path.dirname` === cwd → PASS |
| Cleanup | temp file is removed after the call | harness C: file gone after unlink → PASS |
| Hermes inlines the file | `@file:` of the written context expands (content present, not blocked) | harness D: round-trip `preprocess_context_references` → PASS (expanded, blocked=False, 35604 tokens, content present) |
| Mentions safe | `@user` inside the context is not re-expanded | harness D + PCB V#5 → PASS (`@copain` kept literal) |
| Issue lifecycle documented | comment posted before state transition | `rad issue show 1f154fc` shows transition comment (at solve time) → PENDING (lands at merge) |
