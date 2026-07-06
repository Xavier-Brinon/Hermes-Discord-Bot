---
artifact_type: change_boundary
task_id: no-embed-abstain
timestamp: 2026-07-06T06:20:26Z
complexity_score: 2
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `prompts.js` | Grant the abstain sentinel unconditionally in `buildLinkPrompt`'s no-meta branch; extract the shared `abstain` sentence | modify |
| `test/prompts.test.js` | Update the now-stale no-meta byte-identical test; add a no-embed abstain-path unit test | modify |
| `.artifacts/no-embed-abstain/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/no-embed-abstain/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/no-embed-abstain/change_boundary.md` | Skill C artifact (this file) | create |
| `.artifacts/no-embed-abstain/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/no-embed-abstain/adherence_report.md` | Review Gate self-attestation | create |
| `SESSION_LOG.md` | Pre-/Post-Flight journal section | modify |
| `METRICS.md` | Regenerated rollup | modify |

## Out-of-Bound List
- `hermes-cli.js` — `summarizeLink` already maps the sentinel → `messagesFR.linkUnreadable`; no change needed.
- `config.js` — `messagesFR.linkUnreadable` reused verbatim; no new message.
- `hermes-discord-bot-clean.js` — `summarizeLink` signature unchanged; no call-site touch.
- `prompts.js` `buildAskPrompt` @mention-summary path — different route; issue scopes only `buildLinkPrompt`.
- `evals/` — abstention-reliability eval is a separate issue (dbf02a1).
- `text.js`, `recap.js`, `cache.js` — unrelated to the link-summary prompt.

## Orthogonal Issues (noticed, skipped)
- Prompt-side abstention RELIABILITY is model/prompt-dependent and not unit-testable from the local checkout (no Hermes CLI); its eval lives in issue dbf02a1 — not this task.
- The no-embed-at-all case (a bare URL with zero embed, issue de52e4a's sibling framing) is already covered: with no embed, `extractLinkMeta` returns null → the no-meta branch now abstains. No extra work.

## Orphan Tracking
- None. No import/var becomes unused; the `abstain` const is consumed by both ternary branches.
