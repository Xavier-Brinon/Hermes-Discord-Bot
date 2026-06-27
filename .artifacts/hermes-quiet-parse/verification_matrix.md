---
artifact_type: verification_matrix
task_id: hermes-quiet-parse
timestamp: 2026-06-27T11:26:00Z
complexity_score: 5
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| Clean -Q response | stdout becomes the response verbatim | `parseHermesOutput — clean -Q success` → PASS |
| Strip leaked warning | leading `⚠ ` diagnostic line dropped | `parseHermesOutput — drops a leaked ⚠ CLI diagnostic line` → PASS |
| Preserve emoji answer | leading `⚠️` (U+FE0F) line kept | `parseHermesOutput — preserves a real ⚠️ emoji` → PASS |
| Session id from stderr | `session_id:` read from stderr | `parseHermesOutput — session id read from stderr` → PASS |
| Empty-output fallback | warning-only stdout → empty response | `parseHermesOutput — warning-only stdout yields empty` → PASS |
| No id → null | absent session_id yields null | `parseHermesOutput — no session id anywhere yields null` → PASS |
| No regression in prompts | builder/extractThemes tests unchanged | existing 8 tests still PASS |
| Bot still parses | node --check passes | `node --check hermes-discord-bot-clean.js` → PASS |
| No banner scraping remains | no `⚕ Hermes`/inAnswer/extractSessionId in bot | grep → none |
| All 3 flows quiet | `-Q --source tool` at both execFile sites | grep → present (askHermes, summarizeLink) |
| Issue lifecycle documented | comment posted before state transition | `rad issue show 9864045` shows transition comment (at solve time) |
