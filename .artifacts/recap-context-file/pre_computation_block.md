---
artifact_type: pre_computation_block
task_id: recap-context-file
timestamp: 2026-06-28T11:11:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Hermes 0.17.0 resolves the chat query ONLY from `-q/--query`; it does not read the query from stdin and has no query-file flag, so the issue's "write to child.stdin" fix is infeasible | HIGH |
| 2 | `@file:` context references expand in non-interactive `-q` mode (single-query routes through `cli.chat()`, which runs the same `@`-expansion as interactive) | HIGH |
| 3 | `@file:` resolves the path under Hermes's cwd (`allowed_root` defaults to cwd); a path outside cwd is rejected with a warning, not a crash | HIGH |
| 4 | The bot's process cwd equals Hermes's cwd (`execFile` sets no `cwd`), and on the VPS that is `/data/workspace` (manage_hermes.sh `cd`s there) — so a temp file under `process.cwd()` is always inside `allowed_root` | HIGH |
| 5 | Discord `@username` mentions inside the injected file are NOT re-expanded — refs are parsed from the original prompt once; injected content is not re-scanned | HIGH |
| 6 | If the injected file exceeds 50% of the model's context length Hermes refuses (`blocked`), returning a refusal string; for the discord-bot profile's model (large-context chat model) a ≤100 KB / ~25 K-token recap stays well under the limit | MEDIUM |
| 7 | Linux `MAX_ARG_STRLEN` (per-argument cap) is 131072 bytes; a 200×500-char recap can reach ~138 KB in UTF-8 and overflow it — E2BIG is genuinely reachable | HIGH |

## Scope Declaration
### Files in scope
- hermes-discord-bot-clean.js — add a byte-threshold guard in `askHermes` that offloads bulky `extraContext` to a temp file under `process.cwd()` + temp-file write/cleanup helpers
- prompts.js — add `buildAskPromptWithContextFile(question, ref)` builder + export (keep prompt text in the single-source-of-truth module)
- test/prompts.test.js — unit test for the new builder
- .gitignore — ignore the transient `.hermes-recap-ctx-*.txt` pattern

### Files off-limits
- summarizeLink (in bot) — link-summary context is small (a URL + short note); no overflow path, leave on argv
- prompts buildAskPrompt/buildRecapPrompt/extractThemes — prompt/parser contracts unchanged
- manage_hermes.sh, README.md, CLAUDE.md, evals/ — no run/ops/doc/eval-contract change needed

## Interpretations of the request
- "pass via stdin" is the issue's *suggested* mechanism, not a hard requirement; the acceptance criteria (200-msg recap completes without E2BIG; @mention still works; no answer/session regression) are the real contract. Since stdin is infeasible against this CLI, the user selected the `@file:` injection as the substitute (AskUserQuestion).
- The root cause is "a single argv string exceeds MAX_ARG_STRLEN", so the guard keys on assembled-prompt byte length, not on "is this a recap" — a general safety net at the one shared chokepoint (`askHermes`).

## Alternatives considered
- Write the prompt to `child.stdin` (the issue's stated fix) — rejected: verified Hermes never reads the query from stdin (`query = query or q`, cli.py:15139; no `stdin.read`); it would hang/ignore.
- Cap/truncate the context to a safe byte budget — viable and lowest-coupling, but loses data; user chose `@file:` to avoid client-side loss (AskUserQuestion).
- Always route context via `@file:` (even small prompts) — rejected: needlessly reframes every @mention and adds temp-file churn on the hot path; keep the small path byte-identical.
- Chunk/summarise context client-side before sending — rejected: heavy, changes recap semantics, larger diff.

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -n "query = query or q" cli.py` + `grep stdin.read cli.py` | query only from `-q`; no stdin read | line 15139 match; zero stdin.read hits | 2026-06-28T10:40:00Z | PASS |
| 2 | trace single-query send: `grep -n "\.chat(" cli.py` (≥15000) → `@`-expansion site | `cli.chat()` at 15517 reaches expansion at 11541 | confirmed (15517 → 11541, TTY-independent) | 2026-06-28T10:45:00Z | PASS |
| 3 | venv python: `preprocess_context_references(prompt, cwd=ws, context_length=200_000)` with relative `@file:` | expanded=True, blocked=False, file content present, `@bob` kept literal | expanded=True, blocked=False, BANANE present, `@bob` literal | 2026-06-28T11:02:00Z | PASS |
| 4 | same, `@file:/etc/hosts` (outside cwd) | warning, not crash | `path is outside the allowed workspace` warning; blocked=False | 2026-06-28T11:02:00Z | PASS |
| 5 | same, `context_length=10` (force >50%) | blocked=True | blocked=True; `exceeds the 50% hard limit` | 2026-06-28T11:02:00Z | PASS |
| 6 | `grep -nE "cd \|/data/workspace" manage_hermes.sh` | launcher cd's to /data/workspace | `cd /data/workspace` before pm2 start | 2026-06-28T10:55:00Z | PASS |
