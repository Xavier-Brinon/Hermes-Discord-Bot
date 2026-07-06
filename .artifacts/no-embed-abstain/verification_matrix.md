---
artifact_type: verification_matrix
task_id: no-embed-abstain
timestamp: 2026-07-06T06:20:26Z
complexity_score: 2
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| No-embed link can abstain | `buildLinkPrompt(url, ctx)` (no meta) contains `CONTENU_INACCESSIBLE` + the abstain instruction | unit: `assert.ok(prompt.includes(LINK_UNREADABLE_SENTINEL))` on the no-meta prompt | PASS — new test green; node eyeball shows the abstain line in the no-meta prompt |
| No false identity clause | no-meta prompt has NO `VÉRIFICATION OBLIGATOIRE` / `identifié` language (nothing to match) | unit: `assert.doesNotMatch(prompt, /VÉRIFICATION OBLIGATOIRE/)` | PASS — new test green; node assert "no-meta has NO VERIFICATION: true" |
| Readable article still summarised | no-meta prompt still carries the shared summary format; the abstain clause is conditional | unit: `assert.ok(prompt.includes(buildSummaryFormat()))` | PASS — summary format present after the conditional "Si tu ne peux pas accéder…" clause |
| meta=null == omitted meta | both calls hit the same else branch → byte-identical | existing test prompts.test.js:68 still passes | PASS — suite green; node assert "null === omitted meta byte-identical: true" |
| Byte-identical test updated | the stale no-meta full-string test now asserts the abstain clause | prompts.test.js:46 expected string updated + passes | PASS — expected string now includes the sentinel abstain line; test green |
| meta-present path unchanged | with-meta prompt still byte-identical (title/author/provider + VÉRIFICATION + sentinel) | existing tests prompts.test.js:72–92 still pass | PASS — suite green; node eyeball of the meta prompt matches the prior string |
| Single sentinel reused | no second sentinel introduced | `grep -c "CONTENU_INACCESSIBLE" prompts.js` unchanged shape (one const) | PASS — one `LINK_UNREADABLE_SENTINEL` const, referenced by both branches via shared `abstain` |
| Suite green | full test run passes with the new + updated tests | `npm test` all pass | PASS — 86/86 (was 85; +1 net new) |
| Lint/format clean | no new eslint errors; prettier clean on changed files | `npx eslint` + `npx prettier --check` on prompts.js + test/prompts.test.js | PASS — eslint exit 0, prettier "All matched files use Prettier code style!" |
| Issue lifecycle documented | `rad issue comment` posted before `rad issue state --solved` (patch ID + merge SHA + verification) | `rad issue show de52e4a` displays the transition comment | PENDING — lands at merge (comment precedes state change) |
