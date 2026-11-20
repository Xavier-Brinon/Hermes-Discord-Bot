---
artifact_type: change_boundary
task_id: music-streaming-skip
timestamp: 2026-07-02T08:53:00Z
complexity_score: 2
complexity_tier: TRIVIAL
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| `text.js` | Extend `NON_ARTICLE_PATTERN` with music-streaming/player hosts, REMOVE `reddit\.com` (posts are worth summarising), refresh doc comment | modify |
| `test/text.test.js` | Add test pinning the incident Spotify URL + representative hosts to skip; add test that reddit posts are NOT skipped | modify |
| .artifacts/music-streaming-skip/pre_computation_block.md | Skill A artifact | create |
| .artifacts/music-streaming-skip/simplicity_review.md | Skill B artifact | create |
| .artifacts/music-streaming-skip/change_boundary.md | Skill C artifact (this file) | create |
| .artifacts/music-streaming-skip/verification_matrix.md | Skill D artifact | create |
| .artifacts/music-streaming-skip/adherence_report.md | Review Gate self-attestation | create |
| SESSION_LOG.md | Pre-/Post-Flight journal section | modify |
| METRICS.md | Regenerated rollup | modify |

## Out-of-Bound List
- hermes-cli.js (`summarizeLink`) — the content-aware abstain gate is separate issue 6b1af90
- prompts.js (`buildLinkPrompt`) — same; the "give Hermes permission to abstain" change lives in 6b1af90
- hermes-discord-bot-clean.js — the filter call site is unchanged; classification is entirely in the pattern
- config.js (`LINK_PATTERN`) — link *detection* is orthogonal to *classification*

## Orthogonal Issues (noticed, skipped)
- Prettier reformatted three pre-existing one-liner `if (buffer) { … }` blocks and added one trailing comma in text.js (format drift the repo's own `prettier --check` was already flagging). Left as prettier corrected them so the changed file is format-clean; not a logic change.
- The denylist remains a blocklist: unknown non-article pages still reach Hermes and can be hallucinated — tracked as issue 6b1af90, out of scope here. Removing reddit relies on 6b1af90 to abstain on image/video-only reddit posts.

## Scope note
The reddit removal was requested mid-task and folded into this patch: it is the
same `NON_ARTICLE_PATTERN` regex + same test file, so a separate issue/patch for a
one-token deletion would be process overkill. Recorded as a comment on issue e89a541.

## Orphan Tracking
- None — no symbol added or removed; `NON_ARTICLE_PATTERN` / `isNonArticleUrl` keep the same exports and consumers.
