---
artifact_type: verification_matrix
task_id: processed-messages-bound
timestamp: 2026-06-25T21:05:08Z
complexity_score: 3
complexity_tier: STANDARD
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| Set is size-bounded | `PROCESSED_MESSAGES.size` never exceeds `MAX_PROCESSED_MESSAGES` under sustained adds | unit harness: add 5000 ids via `rememberMessage`, assert final size == 1000 |
| FIFO eviction order | When over cap, the oldest-inserted id is the one evicted | add ids `0..1000`, assert `has('0')` is false and `has('1000')` is true |
| Dedup still works in-window | A re-seen id within the last 1000 adds is still suppressed by the guard | add id X, then within window assert `has(X)` is true |
| Both call sites bounded | No raw `PROCESSED_MESSAGES.add(` remains; both routes go through `rememberMessage` | `grep -c "PROCESSED_MESSAGES.add(message.id)"` == 0; `grep -c "rememberMessage(message.id)"` == 2 |
| No syntax regression | File parses | `node --check hermes-discord-bot-clean.js` exits 0 |
| Guard path unchanged | The `:564` `.has()` early-return is byte-identical | `git diff` shows no change at the guard line |
| Issue lifecycle documented | Comment posted before state transition | `rad issue show 2f4e52a` displays the lifecycle comment ahead of `--solved` |
