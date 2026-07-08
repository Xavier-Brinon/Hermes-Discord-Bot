---
artifact_type: simplicity_review
task_id: d583385-prettierignore
timestamp: 2026-07-08T06:28:26Z
complexity_score: 4
complexity_tier: STANDARD
---

## Simplest Possible Solution

One new `.prettierignore` (records + vendored framework + tool config) and a single
`prettier --write` over the 11 our-source/doc files. No config knobs, no reformatting of vendored
or append-only files. `npm run format` (`prettier --write .`) becomes safe because the ignore file
now shields the 100+ framework records.

## Abstinence List (not added, intentional)

- **A `.prettierrc` / rule tuning** — the repo already delegates style to Prettier defaults via
  `eslint-config-prettier`; changing print-width/tabs now would re-drift every file. Out of scope.
- **Reformatting the vendored framework** (`skills/`, `examples/`, `templates/`, `schemas/`,
  `tools/`) — vendored = track upstream; restyling forks it. Ignored, not formatted.
- **A pre-commit hook / lint-staged** to keep files formatted — that is a separate DX issue
  (setup-pre-commit territory), not this ticket.
- **Ignoring `waysofworking.org`** — Prettier has no org parser and never touches it; an entry
  would be inert noise.
- **Touching CLAUDE.md content** — only whitespace/table/emphasis normalisation from Prettier;
  no prose or instruction changes.

## Line-Count Budget

| Target | Actual | Delta |
|--------|--------|-------|
|     16 |     16 |     0 |

`.prettierignore` ≈ 16 lines (two comment headers + the record + vendored + tool entries). The 11
formatted files are mechanical Prettier output, not hand-authored LOC.

## Simplify Triggers (detected)

- None. The only hand-written artifact is a 16-line ignore file; everything else is
  tool-generated formatting. The discipline is *subtractive* — the ignore list keeps Prettier away
  from records/vendored code, exactly matching `examples/patterns/surgical-diff.md` (change only
  what the ticket needs; do not drag the 100+ framework records into a formatting churn).
