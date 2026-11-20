---
artifact_type: pre_computation_block
task_id: youtube-transcript
timestamp: 2026-08-26T20:12:27Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions

| #   | Assumption                                                                                                                                      | Confidence |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `yt-dlp` retrieves YouTube auto-captions. **Measured** 2026-08-26 with yt-dlp 2026.08.19: `cap.en.vtt` (440 B) + `cap.fr-en.vtt` (402 B) written. | HIGH       |
| 2   | `--js-runtimes node` satisfies yt-dlp's JS-runtime requirement. **Measured**: the deprecation warning disappears; container is already node:22.    | HIGH       |
| 3   | YouTube auto-translates EN captions to `fr-en`, so French grounding needs no translation step. **Measured**: `fr-en` listed and downloaded.        | HIGH       |
| 4   | A `null` transcript leaves today's behaviour byte-identical (prompt string unchanged when the block is empty).                                    | HIGH       |
| 5   | The transcript fits the prompt argv once truncated — 12 000 chars sits far under `MAX_ARGV_PROMPT_BYTES` (96 KB).                                 | HIGH       |
| 6   | Hermes honours an inlined transcript as ground truth and will not abstain when one is present, provided the prompt says so explicitly.            | MEDIUM     |
| 7   | VTT dedup-by-previous-line is enough to undo YouTube's rolling-caption repetition.                                                                | MEDIUM     |
| 8   | **The VPS's datacenter IP is not blocked by YouTube.** Spike ran from a residential IP only. This is the task's principal risk.                   | LOW        |

Assumption 8 is knowingly LOW and is _not_ resolvable from the dev machine. It is
carried as a deploy-time verification row in the Verification Matrix, and the
issue records the fallback ladder (cookies → PO-token provider → residential
proxy → hosted API) if it fails. The design fails **safe**: a blocked fetch
returns `null`, which is exactly assumption 4 — today's behaviour.

## Scope Declaration

### Files in scope

- `youtube.js` — **create**. `isYouTube` / `vttToText` / `fetchTranscript`. New concern, own module, mirroring how `text.js` holds pure helpers.
- `config.js` — **modify**. `YTDLP_BIN`, `TIMEOUT_TRANSCRIPT`, `TRANSCRIPT_MAX_CHARS`, `SUBTITLE_LANGS`. Env-overridable, same pattern as `HERMES_BIN`.
- `prompts.js` — **modify**. `buildLinkPrompt` gains a 4th `transcript` param and the grounding block.
- `hermes-cli.js` — **modify**. `summarizeLink` fetches the transcript for YouTube URLs and passes it through.
- `test/youtube.test.js` — **create**. Unit tests for the two pure helpers.
- `test/prompts.test.js` — **modify**. Cover the new prompt branch + the null-transcript regression guard.

### Files off-limits

- `hermes-discord-bot-clean.js` — the reaction handler already calls `summarizeLink`; the change is behind that boundary. Touching it would be scope bleed.
- `text.js` — `isYouTube` is URL logic and `text.js` is where URL helpers live, so it is genuinely tempting. Deferred: it would drag `youtube.js`'s concern into a module the recap and mention flows both import, for one predicate.
- `recap.js`, `cache.js` — different flows entirely.
- `evals/` — the eval harness asserts on summary _structure_, which is unchanged.
- `manage_hermes.sh`, `README.md` — the binary-provisioning runbook is deploy work; it belongs in the issue's lifecycle comment, not this diff.
- The `MAX_ITERATIONS_NOTICE` / sentinel abstain logic — explicitly preserved untouched. Verified by regression rows, not edited.

## Interpretations of the request

1. **(Chosen)** Ground the _existing_ summariser on transcript text, keeping one code path and the abstain gate intact. The transcript is one more anchor alongside the embed meta.
2. (Rejected) Build a YouTube-specific summariser that bypasses `-t web`. Confirmed against this reading with the user before filing; it duplicates the anchor + abstain logic for a marginal latency win.
3. (Rejected) Treat "transcript" as "post the transcript to Discord". The bot's contract is summaries; a raw transcript is both a wall of text and a content-reuse problem. `TRANSCRIPT_MAX_CHARS` bounds what is even sent to Hermes, and the prompt explicitly forbids quoting it wholesale.

## Alternatives considered

- **`youtube-transcript` npm package** — rejected: it calls `/api/timedtext` directly and breaks whenever YouTube rotates its client requirements. The spike showed yt-dlp silently falling back to the `visionos` player client; that adaptation is the whole value.
- **Playwright / headless Chromium** — rejected: it addresses client attestation, not the datacenter-IP reputation block that is the actual risk here, and it costs ~400 MB plus per-invocation memory in a container that already hosts Hermes.
- **Hosted transcript API (Supadata etc.)** — not rejected, **deferred**. It is the fallback if assumption 8 fails, and is cheaper to adopt _after_ the null-safe seam exists than instead of it.
- **Whisper ASR on downloaded audio** — rejected: needs the same gate to get the audio stream, plus a model and GPU-less transcode budget the VPS does not have.
- **Caching transcripts on disk** — rejected for this commit: `cache.js` exists and the temptation is real, but a summary is already cached downstream, so the transcript cache would be a second cache for a rarer key. YAGNI until measured.

## Gold Standard cited

`examples/patterns/surgical-diff.md` — the change is additive behind one existing
function boundary (`summarizeLink`), with the pre-existing abstain/anchor logic
moved verbatim rather than rewritten.

Secondary: `examples/patterns/minimal-scaffold.md` for `youtube.js` — three
exported functions, no class, no options object, no plugin seam.
