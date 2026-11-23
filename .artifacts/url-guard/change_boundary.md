---
artifact_type: change_boundary
task_id: url-guard
timestamp: 2026-11-23T21:20:30Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `url-guard.js` | Pure URL + IPv4/IPv6 + DNS guard module | create |
| `config.js` | Add French `messagesFR.linkBlocked` string | modify |
| `hermes-discord-bot-clean.js` | Gate `@mention` URLs, scanned links, and `📝` link summaries before invoking Hermes | modify |
| `test/url-guard.test.js` | Unit tests for IPv4, IPv6, obfuscated literals, schemes, local hosts, DNS lookup, and message scanning | create |
| `test/modules.test.js` | Module smoke test for `url-guard.js` and `messagesFR.linkBlocked` | modify |
| `SESSION_LOG.md` | Pre-/Post-Flight journal entry | modify |
| `METRICS.md` | Regenerated adherence rollup | modify |
| `.artifacts/url-guard/pre_computation_block.md` | Skill A artifact | create |
| `.artifacts/url-guard/simplicity_review.md` | Skill B artifact | create |
| `.artifacts/url-guard/change_boundary.md` | Skill C artifact | create |
| `.artifacts/url-guard/verification_matrix.md` | Skill D artifact | create |
| `.artifacts/url-guard/adherence_report.md` | Review Gate report | create |

## Out-of-Bound List
- `hermes-cli.js` — CLI wrapper remains focused on spawning Hermes; gating happens at the entrypoint boundary.
- `youtube.js` — already hostname-allowlisted to YouTube.
- `jorf.js` — fixed DILA HTTPS endpoint.
- `prompts.js` — no prompt changes needed.
- `package.json` — zero new dependencies.

## Orthogonal Issues (noticed, skipped)
- Redirect-following inside Hermes `-t web` and model-constructed URLs require VPS egress / Hermes config controls — opened as follow-up ticket `20261123T211937` in the same Tracker.
- Rate and concurrency limiting on Hermes invocations — separate ticket `20261123T200855` in this Tracker.

## Orphan Tracking
- None expected.
