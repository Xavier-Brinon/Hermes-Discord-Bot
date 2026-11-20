---
artifact_type: pre_computation_block
task_id: hermes-quiet-parse
timestamp: 2026-06-27T11:20:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Hermes 0.17.0 `-Q` prints only the final response on stdout (no banner/Query echo/session block) | HIGH |
| 2 | Hermes 0.17.0 `-Q` emits the session id on stderr as `session_id: <id>` | HIGH |
| 3 | The pre-0.17 banner anchors still render, so the change is proactive (not an outage fix) | HIGH |
| 4 | A startup `⚠ ` diagnostic can leak onto `-Q` stdout and must be stripped; a real `⚠️` answer must survive | MEDIUM |
| 5 | `--source tool` is accepted by 0.17.0 and is the correct tag for a bot integration | HIGH |

## Scope Declaration
### Files in scope
- prompts.js — add the pure `parseHermesOutput(stdout, stderr)` parser
- test/prompts.test.js — unit tests against captured 0.17.0 fixtures
- hermes-discord-bot-clean.js — add `-Q --source tool`; replace both banner loops + extractSessionId with parseHermesOutput

### Files off-limits
- manage_hermes.sh, README.md, CLAUDE.md — no operational/doc change needed
- prompts (buildAskPrompt/buildLinkPrompt/extractThemes) — prompt contracts unchanged

## Interpretations of the request
- "take advantage of the update" = pay down the banner-scraping coupling point using the documented `-Q` programmatic contract, since 0.17.0 rewrote the CLI

## Alternatives considered
- Keep banner scraping, only verify it still works — rejected: leaves the coupling point that the CLI rewrite makes fragile
- Add `-Q` but keep extractSessionId(stdout) — rejected: session id moved to stderr under `-Q`; continuity would silently break
- A JSON output flag — rejected: 0.17.0 `chat` exposes no `--json`; `-Q` is the cleanest contract available

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `hermes chat -q "…"` (non -Q), grep anchors | banner/`──`/session lines present | all present (lines 28,34,37-39) | 2026-06-27T10:56:00Z | PASS |
| 2 | `hermes chat -q "…" -Q`, inspect stdout | response only, no banner/Query echo | confirmed | 2026-06-27T10:57:00Z | PASS |
| 3 | `hermes chat -q "…" -Q`, locate session id | `session_id:` on stderr, not stdout | on stderr | 2026-06-27T10:57:00Z | PASS |
| 4 | `node --test test/*.test.js` | all parseHermesOutput cases pass | 14 pass / 0 fail | 2026-06-27T11:10:00Z | PASS |
