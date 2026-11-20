---
artifact_type: simplicity_review
task_id: mirror-hygiene
timestamp: 2026-11-18T22:20:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
One shell hook that runs `mise x -- gitleaks git --redact --no-banner` on the repo and exits non-zero on a finding or when mise is missing; one `mise.toml` line pinning gitleaks; a short SECURITY.md; one README bullet. GitHub settings change through `gh api`, no files.

## Abstinence List (not added, intentional)
- No `.github/` directory (no PR template, no workflows): Actions is being turned off and Radicle takes contributions.
- No range-based scan, no `.gitleaks.toml` allowlist: history is clean, default rules suffice.
- No hook installer script: one `git config core.hooksPath ops/git-hooks` line in README.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| 15 hook lines + 3 mise.toml lines; SECURITY.md and README prose not counted | 11 hook lines (non-blank) + 3 mise.toml lines | -27% / 0% |

## Simplify Triggers (detected)
- None.
