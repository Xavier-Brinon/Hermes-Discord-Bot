---
artifact_type: verification_matrix
task_id: neutral-hermes-cwd
timestamp: 2026-11-18T19:55:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Complexity Score
Scope 2 (5 files) + Ambiguity 0 (the issue names the fix) + Risk 2 (every Hermes call) + Knowledge Gap 1 (context-file discovery read in the Hermes source) = **5 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 Q&A runs in HERMES_CWD | fake Hermes prints `cwd=<HERMES_CWD>`; dir created with mode 0700 | test/hermes-cwd.test.js "askHermes runs Hermes in HERMES_CWD…" | PASS |
| AC1 📝 link runs in HERMES_CWD | same, through summarizeLink | test/hermes-cwd.test.js "summarizeLink runs Hermes…" | PASS |
| AC2 recap offload in that cwd | `.hermes-recap-ctx-*.txt` listed by the child, dir empty afterwards | test/hermes-cwd.test.js "recap offload…" | PASS |
| Tests detect the bug | all 3 fail with hermes-cli.js reverted | `git stash push hermes-cli.js` + rerun | PASS (3 not ok) |
| No regression | tests, lint, format | node --test test/*.test.js; npx eslint .; npx prettier --check . | PASS: 173/173 (+3) |
| Assumption 5: /data neutral | no `.git`, AGENTS.md, CLAUDE.md, .cursorrules in `/data` | `ls -A /data` on the VPS | PENDING: deploy |
| AC3 persona kept, AC4 no project knowledge | bot answers in persona; asked about AGENTS.md, it has none | live Discord after deploy | PENDING: deploy |
| Issue lifecycle | comment before solve | rad issue show d84e945 | PENDING: merge |
