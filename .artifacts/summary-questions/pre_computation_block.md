---
artifact_type: pre_computation_block
task_id: summary-questions
timestamp: 2026-09-22T19:00:50Z
complexity_score: 5
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | `parseHermesOutput` returns a `sessionId` for summarizeLink runs exactly as for askHermes runs (same `-Q` flags, session id on stderr) | HIGH |
| 2 | `summarizeLink` has exactly one caller (`summariseLinks` in the bot), so changing its resolve value from string to `{ summary, sessionId }` breaks nothing else | HIGH |
| 3 | `--resume` works on a session created with `--source tool --max-turns`: askHermes already resumes `--source tool` sessions today | MEDIUM |
| 4 | unwrapText glues any line not starting with a marker to the previous one; `**1. Titre**` is not a marker (starts with `**`), `1. **Titre**` is — this explains point 1 inline in both screenshots | HIGH |
| 5 | The model reliably emits `**Questions** :` then `1.`/`2.`/`3.` lines — seen in both user screenshots; the parser still falls back to today's single message on any other shape | MEDIUM |
| 6 | A bot reply to its own message does not ping anyone, so posting ❓ messages as replies to the summary is quiet | HIGH |
| 7 | The prompt change cannot be validated offline: no link-summary eval runner exists and local Hermes 0.20 cannot reach Mistral (issue 1ae5380) — validated live after deploy | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | read hermes-cli.js runLinkSummary | `parseHermesOutput(stdout, stderr)` destructures only `response` | :221 `let { response } = parseHermesOutput(...)` — sessionId discarded | 2026-09-22T19:00:50Z | PASS |
| 2 | `grep -rn "summarizeLink(" *.js evals test` | one caller | hermes-discord-bot-clean.js:435 only | 2026-09-22T19:00:50Z | PASS |
| 4 | read text.js unwrapText marker regex | `^(📊\|…\|##\|THEME:\|---$\|[-\d]+[.)]\s)` | matches `1. `, not `**1.` | 2026-09-22T19:00:50Z | PASS |
| 6 | Discord reply semantics | self-reply has no one to ping | the summary's author is the bot | 2026-09-22T19:00:50Z | PASS |
| 7 | `ls evals/` | no link runner | only run-recap-eval.js | 2026-09-22T19:00:50Z | PASS |

## Scope Declaration
### Files in scope
- prompts.js — buildSummaryFormat wording (sections on their own lines, `1. **Titre** :` points, numbered questions, no #); `splitQuestions(summary)`; `QUESTION_PREFIX` + `questionFrom(text)` + `buildQuestionReply(question, reply)`
- hermes-cli.js — summarizeLink / runLinkSummary resolve `{ summary, sessionId }`
- hermes-discord-bot-clean.js — summariseLinks posts body then ❓ questions and records their session; @mention summary path does the same; Q&A path prefixes a reply to a ❓ question
- test/prompts.test.js — format expectations + parser + question helpers
- CONTEXT.md — Link summary glossary entry (questions are separate messages)

### Files off-limits
- text.js — unwrapText is shared by every reply; fixing the prompt to fit its markers is surgical, changing its markers is not
- cache.js — recordSession is reused as-is
- evals/ — hasLinkStructure keys off "Thèse centrale|Idée principale" + "Questions" in RAW output, both still emitted
- recap.js, config.js, youtube.js

## Interpretations of the request
- Primary: each summary question is its own message; a reply to one continues with the summary's context plus that question plus the reply; also fix the Points clés rendering.
- Alternate considered: questions only on the 📝 path. Rejected — the @mention link summary shares buildSummaryFormat, so it would otherwise show the new numbered block un-split, which is fine but inconsistent.

## Alternatives considered
- **Walk the reply chain and paste the summary into a fresh session** (the original plan) — rejected with the user: loses the article, breaks on multi-chunk summaries, mixes multi-link summaries.
- **Add `**` to unwrapText markers** — rejected: affects every bot reply; a hard-wrap landing before a bold word would split a paragraph.
- **Persist questionMsgId → question text** — rejected: the question text is in the replied-to message itself (`❓ ` prefix); one `fetchReference` on replies only.
- **Ask Hermes for JSON output** — rejected: breaks the human-readable `-Q` contract and the evals.
