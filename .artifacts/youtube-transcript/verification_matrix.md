---
artifact_type: verification_matrix
task_id: youtube-transcript
timestamp: 2026-08-26T20:12:27Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Matrix

| #   | Subtask                           | Pass criterion                                                                                                        | Test case                                                                                        | Outcome |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------- |
| 1   | `isYouTube` — positive forms      | `true` for `youtube.com/watch?v=`, `youtu.be/<id>`, `/shorts/`, `/live/`, `m.` and `music.` subdomains                    | `test/youtube.test.js` — 8 URL forms                                                                 | PASS    |
| 2   | `isYouTube` — no substring match  | `false` for `notyoutube.com`, `youtube.com.phishing.example`, a URL with `youtube.com` in path or query                  | `test/youtube.test.js` — hostname parsed via `URL`, not regex-matched                                | PASS    |
| 3   | `isYouTube` — malformed input     | `false`, never a throw, for `''`, `'not a url'`, `null`, `undefined`, `42`, `{}`                                         | `test/youtube.test.js`                                                                               | PASS    |
| 4   | `vttToText` — scaffolding gone    | No `WEBVTT`, `Kind:`, `Language:`, `-->`, `<...>` tag or `align:start` survives                                          | `test/youtube.test.js` against a realistic auto-caption fixture                                      | PASS    |
| 5   | `vttToText` — rolling dedup       | Each phrase emitted twice by the rolling window appears exactly once                                                     | `test/youtube.test.js` — exact-string assertion on the joined result                                 | PASS    |
| 6   | `vttToText` — entity decoding     | `&amp;` `&lt;` `&gt;` `&#39;` `&quot;` `&nbsp;` decode correctly; `&amp;` decodes last                                   | `test/youtube.test.js`                                                                               | PASS    |
| 7   | `vttToText` — empty/garbage       | `''` for `''`, `null`, `undefined`, and a header-only VTT — never throws                                                 | `test/youtube.test.js`                                                                               | PASS    |
| 8   | Truncation bound                  | Output length `<=` maxChars for an oversized input                                                                       | `test/youtube.test.js` — 500-char input capped to 100                                                | PASS    |
| 9   | **Null-transcript regression**    | 3-arg `buildLinkPrompt` is string-identical to the 4-arg call with `null`, on BOTH the meta and no-meta branches         | `test/prompts.test.js` — two `assert.equal`s; empty-string transcript covered too                    | PASS    |
| 10  | Transcript enters the prompt      | Prompt contains the transcript text, the `TRANSCRIPTION DE LA VIDÉO` marker and `source de vérité`                       | `test/prompts.test.js`                                                                               | PASS    |
| 11  | Abstain gate intact               | The sentinel block in `summarizeLink` is unedited; transcript adds a suppression instruction rather than changing logic  | `git diff` shows the sentinel/`messagesFR.linkUnreadable` block untouched; existing tests green      | PASS    |
| 12  | Cap-abstention intact             | `MAX_ITERATIONS_NOTICE` abstention still fires                                                                            | Existing `max-turns-cap` tests still pass within the 107                                             | PASS    |
| 13  | No shell injection                | URL reaches yt-dlp as an argv element, never a shell string                                                              | `grep -nE "\bexec\(" youtube.js` → no match; only `execFile` imported                                 | PASS    |
| 14  | Missing binary is null, not crash | `YTDLP_BIN=/nonexistent` makes `fetchTranscript` resolve `null` and not reject                                           | Runtime: logged `spawn /nonexistent/yt-dlp ENOENT`, returned `null`                                  | PASS    |
| 15  | Temp files cleaned up             | `ytcap-*` count in `os.tmpdir()` is unchanged after both a failing and a succeeding fetch                                | Runtime: equal before/after on both paths (`finally` block)                                          | PASS    |
| 16  | Playlist guard                    | `--no-playlist` present, so a `&list=` URL fetches one video                                                             | `grep -c "no-playlist" youtube.js` → 1                                                               | PASS    |
| 17  | End-to-end, real video            | `fetchTranscript` on a real YouTube URL returns non-empty prose                                                          | Runtime: 217 chars of clean prose, no timings or tags. **First attempt returned HTTP 429** — see below | PASS    |
| 18  | Suite + lint clean                | `npm test` green, `eslint` 0 problems, `prettier --check` clean                                                          | 107/107 (was 90, +17), eslint 0, prettier clean                                                      | PASS    |
| 19  | **VPS datacenter IP works**       | yt-dlp retrieves captions from the VPS, not `Sign in to confirm you're not a bot` / HTTP 429                             | Deploy-time: run the spike command on the VPS. **Assumption 8 — the LOW-confidence row**              | PENDING |
| 20  | Issue lifecycle documented        | `rad issue comment` precedes `rad issue state --solved`, carrying patch ID + HEAD SHA                                    | `rad issue show 7801304`                                                                             | PENDING |

## Notes on row 17

The end-to-end check **failed on its first run** with
`HTTP Error 429: Too Many Requests`, from a residential IP, after only a handful
of caption fetches during the spike and verification. It passed on retry after a
cooldown.

Two things follow, and both matter more than the eventual PASS:

- **The fail-safe path is proven by accident.** A real hard block from YouTube
  produced exactly the specified behaviour — `null` returned, temp directory
  still cleaned, nothing thrown, summary degrading to the embed-anchored
  behaviour. That is row 14's guarantee demonstrated against a genuine block
  rather than a synthetic one.
- **It downgrades the outlook for row 19.** If a residential IP rate-limits after
  a handful of requests, a datacenter IP is materially likelier to. The 429 is
  what prompted cutting `SUBTITLE_LANGS` from three entries to two, halving the
  requests per video, but that reduces the rate rather than removing the risk.

## Rows that cannot pass in a coding session

Rows 19 and 20 are deploy-time and merge-time respectively. Row 19 decides
whether the feature is viable in production at all; if it fails, the issue closes
and the fallback ladder in the issue body becomes the next issue. The code is
built so that outcome costs nothing — a permanently blocked fetch is the `null`
path, which is today's behaviour.
