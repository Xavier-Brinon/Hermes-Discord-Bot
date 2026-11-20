---
artifact_type: simplicity_review
task_id: stop-publishing-env
timestamp: 2026-11-18T22:47:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Simplest Possible Solution
Cut README §Secrets in one block, remove its one link, add two ignore lines, `git rm --cached .env`. The cut text goes, converted to Org, into a gitignored file so nothing is lost.

## Abstinence List (not added, intentional)
- No history rewrite, no new repo.
- No `.env.example`: the README already names the variables where they are used.
- No change to `ops/rotate-secrets.sh` without a user decision.

## Line-Count Budget

| Target | Actual | Delta |
| ------ | ------ | ----- |
| README: -76 lines (the section) and 1 edited; .gitignore: +4 | README -77/+1 (76 section + 1 link line edited); .gitignore +6/-1 | README on budget; .gitignore +2 comment lines over (prose) |

## Simplify Triggers (detected)
- None.
