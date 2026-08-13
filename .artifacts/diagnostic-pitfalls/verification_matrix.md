---
artifact_type: verification_matrix
task_id: diagnostic-pitfalls
timestamp: 2026-08-13T14:33:55Z
complexity_score: 0
complexity_tier: TRIVIAL
---

## Complexity Score

Scope 0 (1 file: waysofworking.org) + Ambiguity 0 (the exact section text was drafted and
approved before any edit) + Risk 0 (docs-only, no code path) + Knowledge Gap 0 = **0 → TRIVIAL**
(Skill D only; minimal matrix, no Session Journal — matching the `catch-hygiene` precedent, which
also carries no `# Task:` entry in `SESSION_LOG.md`).

Source: the 2026-08-13 Hermes-version investigation, which produced five distinct reporting
failures. The project-specific counterparts are filed separately as `9afaeac` (log the resolved
`HERMES_BIN`) and `c8e3c35` (document the launcher-faithful health check), so this task carries
only the framework-generic vocabulary.

## Matrix

| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 — section exists | a `* Diagnostic pitfalls` top-level heading is present | `grep -n '^\* Diagnostic pitfalls' waysofworking.org` | PASS — one match |
| AC2 — five terms defined | Surrogate Surface, Liveness Fallacy, Deferred Decisive Check, Version-Bound Finding, Premature Severity | inspect the term table | PASS — 5 rows, each traceable to a real observed failure this session |
| AC3 — four rules present | measure the system of record; label provisional conclusions; observability beats inference; findings carry their version | inspect the description list | PASS — 4 `::` entries |
| AC4 — org style (em-dashes) | no U+2014 and no prose `---`, per the style guide's *No em-dashes* rule | `git diff -U0 \| grep '^+' \| grep -c '—'` | PASS — 0. The single `---` hit is the org table separator row (table syntax, not prose) |
| AC4 — org style (lists) | term/definition bullets use `- Term :: explanation`, not the forbidden `- *Term* — explanation` shape | inspect the four rules | PASS — description-list syntax throughout |
| AC4 — org style (markup) | no markdown `**bold**`, no trailing whitespace | `git diff -U0 \| grep '^+' \| grep -c '\*\*'` and `grep -c ' $'` | PASS — 0 and 0 |
| AC5 — no project specifics | no Hermes / HERMES_BIN / VPS content leaks into the vendored framework file | `git diff waysofworking.org \| grep -icE 'hermes\|VPS\|discord'` | PASS — 0 |
| AC6 — docs-only, additive | no code touched; the change adds without rewriting vendored prose | `git diff --numstat` | PASS — `25  0  waysofworking.org`; 25 added, 0 removed, 1 file |
| Deviation recorded | the surrounding vendored content violates the same two org rules; it was NOT restyled | inspect the diff for edits outside the new section | PASS — 0 lines removed, so no pre-existing prose was touched (see Deviation below) |
| Issue lifecycle documented | `rad issue comment` before `rad issue state --solved` | `rad issue show 36b08cb` | PENDING — lands at merge |

## Deviation from the stated acceptance criteria

The issue's AC said "org style matches the file". That is in direct conflict with the org style
guide, which forbids em-dashes and the `- *Term* — explanation` shape — both of which the
surrounding vendored content uses throughout (e.g. the `* Conventions` list).

Resolved toward the style guide for authored content, on the grounds that `waysofworking.org` is
emitted verbatim at bootstrap and its existing prose is frozen upstream output, not ours to
restyle. Restyling it would also be scope bleed on a one-section change, and would be reverted by
the next bootstrap. The new section therefore reads slightly differently from its neighbours: this
is deliberate, not drift.

For the same reason the org-review skill's default 80-column auto-fill was skipped — a blanket
reflow would have rewritten the entire vendored file.
