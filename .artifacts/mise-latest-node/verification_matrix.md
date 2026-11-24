---
artifact_type: verification_matrix
task_id: mise-latest-node
timestamp: 2026-11-24T10:31:30Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## Complexity Score
Scope 1 (3 files: `.nvmrc`, `mise.toml`, `manage_hermes.sh`) + Ambiguity 0 (exact edits requested) + Risk 1 (startup PATH resolution, guarded by `[ -d ... ]`) + Knowledge Gap 0 = **2 → TRIVIAL** (Skill D only).

## Minimal variant (TRIVIAL only)
- Pass: `mise.toml` pins `node = "latest"`, `.nvmrc` is `26`, `manage_hermes.sh` prepends `/data/.local/share/mise/shims` and `/data/.local/bin` when present and passes `bash -n`, and frontmatter lint + eslint + unit tests pass.
