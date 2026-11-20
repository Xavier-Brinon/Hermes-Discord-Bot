---
artifact_type: verification_matrix
task_id: stale-doc-refs
timestamp: 2026-07-06T19:54:23Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Link-summary entry corrected | CONTEXT.md "Link summary" says 📝-reaction opt-in on ANY link, no denylist | read CONTEXT.md:17 | PASS — reworded to `SUMMARY_REACTION` opt-in, "no host denylist, no auto-summary on post" |
| Banner→-Q entry corrected | CONTEXT.md glossary describes `-Q` output parsing via `parseHermesOutput`, not a banner | read CONTEXT.md:18 | PASS — renamed "Output parsing (`-Q`)"; only `⚕ Hermes` mention is the "no banner" negation |
| CLAUDE.md architecture corrected | CLI-wrapper bullet says `-Q` mode + `parseHermesOutput` | read CLAUDE.md:17-20 | PASS |
| CLAUDE.md flows corrected | three-flows (3) says 📝-reaction opt-in link summary | read CLAUDE.md:21-22 | PASS |
| CLAUDE.md summary line corrected | top line no longer says "article links" | read CLAUDE.md:4 | PASS — "summarises links on a 📝 reaction" |
| No stale terms survive | no doc reference to NON_ARTICLE_PATTERN / "auto link-summary" / "article URL is posted/detected" | `grep -rniE` over the 4 docs | PASS — "CLEAN — no stale symbol/behaviour refs" |
| Claims match code | each new statement is true of the current code | git grep -Q/parseHermesOutput/messageReactionAdd/tombstone comment | PASS — all 5 PCB verifications PASS |
| No code touched | .js untouched; suite still green | `git diff --stat` (only CONTEXT.md + CLAUDE.md); `npm test` | PASS — 2 docs files, 7/7; npm test 86/86 |
| Issue lifecycle documented | `rad issue comment` before `rad issue state --solved` (patch/SHA + verification) | `rad issue show 06e0595` displays the transition comment | PENDING — lands at merge |
