---
artifact_type: pre_computation_block
task_id: strip-reading-progress
timestamp: 2026-07-03T14:04:43Z
complexity_score: 3
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The narrow line-filter regex `/^\s*(?:📄\|📖) Reading /u` matches the two Hermes trace forms (`📄 Reading <url>`, `📖 Reading <file> L<range>`) and does NOT match a real French answer — including one that mentions "reading" or leads with the 📄 emoji outside the trace shape. | HIGH |
| 2 | The 📄/📖 lines are on STDOUT (not stderr) — the issue's "Confirm first" capture shows them in the `--- HERMES OUTPUT ---` block, which logs `stdout`. parseHermesOutput already only reads stdout for the response, so a stdout-side filter is the right seam. | HIGH |
| 3 | The issue body's pasted 3-line sequence (📄→📖→"Voici un résumé du documentaire…") IS a real PM2 capture by the author; I cannot re-capture from PM2 locally (the log lives on the remote VPS), so I build the test fixture from that documented capture. | MEDIUM |
| 4 | A line-wise filter (strip the trace line anywhere) is safe and strictly more robust than a leading-only skip: the emoji + English "Reading " prefix is specific enough that removing it mid-stream cannot eat a French answer line, and it survives the case where the agent interleaves a second fetch/read after starting to write. | MEDIUM |
| 5 | Redeploying prod alone (stale 51d38dc → current) would NOT fix this: parseHermesOutput has never stripped 📄/📖 lines in any build, so the code change is required. Verified by reading the current source + the 51d38dc..HEAD prompts.js log (only summary-format + recap-context-file touched it). | HIGH |

## Scope Declaration
### Files in scope
- prompts.js — add a one-line trace-line filter inside parseHermesOutput, ahead of the existing leading-skip loop
- test/prompts.test.js — add parseHermesOutput cases: leading trace lines stripped; interleaved trace line stripped; real answer with "reading"/emoji untouched

### Files off-limits
- hermes-cli.js — both call sites (askHermes, summarizeLink) consume parseHermesOutput's return; they inherit the fix for free, no change
- text.js — its `📄 Réponse détaillée` is an embed field name (bot output), unrelated to Hermes trace parsing
- prompts.js builders (buildAskPrompt/buildLinkPrompt/…) — the prompts are not the leak surface; only the parser changes

## Interpretations of the request
- "Strip tool-progress lines leaking past -Q" = filter the specific 📄/📖 `Reading` trace forms out of the parsed response, keeping the pattern narrow so a legitimate answer is never truncated
- "Confirm first (leading vs interleave)" = I can't re-capture from PM2 locally; I choose the line-wise filter, which is correct for BOTH shapes, so the ambiguity is dissolved rather than gambled on

## Alternatives considered
- Leading-only skip (extend the existing ⚠ skip loop to also consume 📄/📖 lines) — rejected: mirrors the ⚠ handling but silently fails if a trace line ever interleaves after the answer starts; line-wise costs one extra `.filter` and removes the risk
- Broad "strip any emoji-led line" — rejected: would eat a legitimate answer that opens with an emoji (Skill B over-reach; violates the "keep it narrow" acceptance criterion)
- Fix it upstream in the Hermes profile / -Q flag — rejected: the profile lives on the VPS outside this repo; the durable fix belongs in the parser that is this repo's documented coupling point

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `node -e` over the regex vs 6 cases (2 trace forms, indented, real answer, "reading" answer, emoji-not-trace) | 3 true / 3 false | true,true,true,false,false,false | 2026-07-03T14:04:43Z | PASS |
| 2 | `git log --oneline 51d38dc..HEAD -- prompts.js` | only summary-format + recap-context-file (no Reading-strip) | 089cc4b, d811c8c | 2026-07-03T14:04:43Z | PASS |
