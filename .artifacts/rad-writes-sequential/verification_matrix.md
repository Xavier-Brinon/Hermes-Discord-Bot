---
artifact_type: verification_matrix
task_id: rad-writes-sequential
timestamp: 2026-11-18T12:10:00Z
complexity_score: 0
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 0 (1 file: AGENTS.md, which CLAUDE.md symlinks to) + Ambiguity 0 + Risk 0 (agent docs) + Knowledge Gap 0 (incident observed this session) = **0 → TRIVIAL** (Skill D only; minimal matrix, no Session Journal).

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 no parallel rad writes recommended | the "COBs are CRDTs … run in parallel" bullet is gone | `grep -n -i parallel AGENTS.md` | PASS: one hit, the new warning against parallel writes |
| AC2 check before retrying a lock error | bullet names `rad issue show <id> --verbose` before a retry | read AGENTS.md:91-97 | PASS |
| Points to the skill | bullet cites radicle-ops Gotcha #5 (fixed upstream, Radicle-ops 38ba49d) | read AGENTS.md:96 | PASS |
| No regression | prettier clean | `npx prettier --check AGENTS.md` | PASS |
| Issue lifecycle documented | `rad issue comment` before `rad issue state --solved` | `rad issue show 2388cd6` | PENDING: lands at merge |
