---
artifact_type: verification_matrix
task_id: timeout-web-aware
timestamp: 2026-06-24T21:40:00Z
complexity_tier: STANDARD
complexity_score: 3
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| Remove dead config object | `HERMES_CONFIG` and `maxResponseLength` appear nowhere in the source | `grep -c "HERMES_CONFIG\|maxResponseLength" hermes-discord-bot-clean.js` returns `0` | PASS — returned `0` |
| Normal-Q&A timeout matches comment | Plain Q&A (no web) resolves to 90000 ms | `askHermes(..., useWebTools=false, customTimeout=null)` path uses `TIMEOUT_NORMAL` (90000); grep the constant value | PASS — `:84 TIMEOUT_NORMAL = 90000`, used at `:197` |
| Web calls get a longer budget | A `-t web` Q&A resolves to 150000 ms, > the 62.3s prod failure | `askHermes(..., useWebTools=true, customTimeout=null)` path uses `TIMEOUT_WEB` (150000); assert 150000 > 62300 | PASS — `:85 TIMEOUT_WEB = 150000`, branch at `:197`; 150000 > 62300 |
| Explicit override still wins | Recap call keeps 120s via named constant | line 699 call passes `TIMEOUT_RECAP`; `TIMEOUT_RECAP === 120000` | PASS — `:86 TIMEOUT_RECAP = 120000`, passed at `:699` |
| summarizeLink shares web budget | The hardcoded 60000 in `summarizeLink` is replaced by `TIMEOUT_WEB` | `grep -n "60000" hermes-discord-bot-clean.js` returns no match | PASS — no `60000` match; `:260 timeout: TIMEOUT_WEB` |
| Single message-length authority | `DISCORD_MSG_LIMIT` is the only length constant | `grep -c "DISCORD_MSG_LIMIT" ...` ≥ 1 and no `maxResponseLength` | PASS — `DISCORD_MSG_LIMIT` count 5; `maxResponseLength` gone |
| Script still parses | No syntax error introduced | `node --check hermes-discord-bot-clean.js` exits 0 | PASS — exit 0 |
