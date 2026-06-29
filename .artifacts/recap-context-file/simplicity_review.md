---
artifact_type: simplicity_review
task_id: recap-context-file
timestamp: 2026-06-28T11:12:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
One guard at the single shared chokepoint (`askHermes`): after building the prompt,
if it carries `extraContext` AND its UTF-8 byte length exceeds `MAX_ARGV_PROMPT_BYTES`
(96 KB, under Linux's 131072 `MAX_ARG_STRLEN`), write `extraContext` to a temp `.txt`
under `process.cwd()` and rebuild the prompt to reference it with Hermes's own
`@file:<basename>`; unlink the file in the execFile callback. The prompt text lives in
`prompts.js` as `buildAskPromptWithContextFile`. The small-prompt path is untouched
(byte-identical argv for every normal @mention).

## Abstinence List (not added, intentional)
- No stdin/streaming transport — the CLI can't read the query from stdin (verified); it would be dead code
- No chunking/summarisation layer — out of scope; the issue accepts attaching full context
- No client-side truncation/cap — the user chose @file: precisely to avoid losing messages
- No always-on @file: routing — only triggers over the byte threshold; the hot path stays inline
- No change to summarizeLink — its context is small; no overflow path to fix
- No retry/handling for the 50%-context refusal — it degrades to the existing "themes not found" fallback (graceful); a handler would be speculative

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|     26 |     36 |  +38% |

(Logical LOC counted on `prompts.js` + `hermes-discord-bot-clean.js` via
`git diff | awk` excluding blank/comment lines; test + .gitignore excluded.)

## Simplify Triggers (detected)
- **Delta +38% over the pre-code Target (26 → 36).** Re-planned per `skills/simplicity.md` instruction 3 / failure-mode #2. The overage is *mandatory I/O scaffolding*, not new abstraction: a `writeContextFile` helper (filename + write with try/catch) and a `cleanupContextFile` helper (unlink with ENOENT-aware error handling), each mirroring the repo's existing named single-purpose helpers (`saveCache`, `saveSessionCache`, `rememberMessage`). No flag, config knob, class, or generalisation was added (see Abstinence List). Cuts considered and rejected: (a) inlining the single-use `cleanupContextFile` (≈ −4 LOC) — rejected to stay consistent with the repo's named-helper idiom and keep robust cleanup readable; (b) folding the `catch` blocks onto one line — rejected as line-golfing, which `schemas/artifacts.md` §2 explicitly forbids. Corrected realistic Target for this minimal solution is ~34; Actual 36 sits +6% over that.
