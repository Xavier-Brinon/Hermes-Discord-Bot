---
artifact_type: change_boundary
task_id: youtube-transcript
timestamp: 2026-08-26T20:12:27Z
complexity_score: 6
complexity_tier: COMPLEX
---

## File Touch List

| Path                    | Why                                                                                                | Change type |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ----------- |
| `youtube.js`            | New concern: YouTube URL detection, WebVTT→prose, and the bounded `yt-dlp` call.                    | create      |
| `config.js`             | `YTDLP_BIN`, `TIMEOUT_TRANSCRIPT`, `TRANSCRIPT_MAX_CHARS`, `SUBTITLE_LANGS` — env-overridable.       | modify      |
| `prompts.js`            | `buildLinkPrompt` gains a 4th `transcript` param + the grounding block that suppresses the abstain.  | modify      |
| `hermes-cli.js`         | `summarizeLink` awaits the transcript for YouTube URLs and threads it into the prompt.               | modify      |
| `test/youtube.test.js`  | Unit coverage for `isYouTube` + `vttToText` (both pure).                                            | create      |
| `test/prompts.test.js`  | New prompt branch + the null-transcript byte-identity regression guard.                             | modify      |

## Out-of-Bound List

| Path                          | Reason deferred                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `hermes-discord-bot-clean.js` | The reaction handler calls `summarizeLink`; the change lives entirely behind that boundary.            |
| `text.js`                     | Tempting home for `isYouTube` (URL helpers live here), but that imports one module's concern into the mention/recap flows. Different concern. |
| `recap.js`, `cache.js`        | Different flows. `cache.js` is specifically declined in the Simplicity Review (transcript cache = YAGNI). |
| `evals/`                      | Asserts on summary structure, which does not change.                                                   |
| `manage_hermes.sh`, `README.md` | Binary provisioning is deploy work, recorded in the issue lifecycle comment, not this diff.          |
| `package.json`                | No npm dependency is added — `yt-dlp` is an external binary reached via `execFile`, like `hermes`.     |

## Creation Order

Ordering matters only in that the transcript must exist before the prompt can
consume it:

1. `config.js` — constants first; `youtube.js` imports them.
2. `youtube.js` — the module under test.
3. `test/youtube.test.js` — proves the pure helpers before anything depends on them.
4. `prompts.js` — the prompt branch.
5. `hermes-cli.js` — wires `youtube.js` into `summarizeLink`.
6. `test/prompts.test.js` — covers the branch and the regression guard.

## Invariants that must survive the diff

These are the things the change is most likely to break, and each has a
Verification Matrix row:

- `CONTENU_INACCESSIBLE` sentinel handling in `summarizeLink` — untouched.
- `MAX_ITERATIONS_NOTICE` cap-abstention — untouched.
- `buildLinkPrompt(url, context, meta)` with three arguments returns the **exact
  string it returns today**. The 4th parameter defaults to `null` and the
  grounding block is `''` when absent.
- `summarizeLink`'s existing `execFile` body moves into a helper **verbatim**
  except for the prompt argument. It is not rewritten.
- `execFile`, never `exec` — a URL from Discord reaches the yt-dlp argv.
