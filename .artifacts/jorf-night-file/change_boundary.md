---
artifact_type: change_boundary
task_id: jorf-night-file
timestamp: 2026-10-16T12:55:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## File Touch List

| Path | Why | Expected change type |
| ---- | --- | -------------------- |
| `jorf.js` | JO night file fetch + filter into facts | create |
| `test/jorf.test.js` | tests, no network | create |
| `test/fixtures/jorf/JORFSIMPLE_20261010-002617.tar.gz` | real sample | create |
| `docs/adr/0002-daily-government-recap-in-the-same-bot.org` | status → accepted | modify |

## Out-of-Bound List
- `hermes-discord-bot-clean.js` — wiring is 2b330be.
- `prompts.js` — recap prompt is b51086a.
- `config.js` — no shared constant yet.
- `docs/research/french-gov-activity-sources.org` — the NUM rule is recorded in jorf.js and the issue comment, not retrofitted into the dated research note.

## Orthogonal Issues (noticed, skipped)
- An untracked Emacs backup `docs/adr/0002-…org~` sits next to the ADR; `.gitignore` does not cover `*~`. Not this task.
- The research note places `JORFCONT*.xml` beside its container directory; in the real archive it is inside it. Harmless: the walk only reads JORFTEXT files.

## Orphan Tracking
- None.
