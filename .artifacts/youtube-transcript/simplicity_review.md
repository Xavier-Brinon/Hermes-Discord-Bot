---
artifact_type: simplicity_review
task_id: youtube-transcript
timestamp: 2026-08-26T20:12:27Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution

When the link is a YouTube URL, shell out to `yt-dlp` with `--skip-download
--write-subs --write-auto-subs` into a temp directory, take the best subtitle
file it wrote, strip the WebVTT timing scaffolding down to plain prose, truncate
it, and paste it into the existing link prompt as one more ground-truth anchor.
Everything else — the anchor check, the `CONTENU_INACCESSIBLE` abstain gate, the
`--max-turns` cap, the French output — stays exactly as it is. Any failure at any
step returns `null`, and a `null` transcript produces the prompt string the bot
builds today.

## Abstinence List (not added, intentional)

- **Transcript disk cache** — `cache.js` is right there and caching feels free.
  Not added: the _summary_ is already cached downstream, so this would be a
  second cache keyed on a rarer event. Add it when a repeat-fetch is measured.
- **Retry / backoff ladder around yt-dlp** — a blocked fetch is blocked; retrying
  a datacenter-IP rejection just burns the timeout budget. One attempt, then
  `null`.
- **Cookie / proxy / PO-token plumbing** — the whole fallback ladder is written
  down in the issue and deliberately unbuilt. Building it now would be designing
  against assumption 8 before it has been measured on the VPS.
- **Configurable subtitle-language priority list at runtime** — `SUBTITLE_LANGS`
  is one constant, not a per-guild setting. The bot speaks French.
- **A `Transcript` type / class with `.toPrompt()`** — it is a string or `null`.
- **Generic `VideoProvider` abstraction** (Vimeo, Dailymotion, Twitch…) — one
  provider, one predicate. The issue explicitly scopes non-YouTube out.
- **Streaming / chunked transcript handling for long videos** — truncation at
  `TRANSCRIPT_MAX_CHARS` is the whole strategy. A 3-hour podcast gets its first
  ~12 000 chars summarised, which is a known and acceptable limitation.
- **Speaker diarisation / timestamp preservation** — the summariser wants prose,
  not a subtitle track. Timings are stripped, not modelled.
- **A `--js-runtimes` auto-detect probe** — the container is node:22 and `node`
  is on PATH by construction. Hardcode it; do not probe.

## Line-Count Budget

| Target        | Actual | Delta |
| ------------- | ------ | ----- |
| 130 (initial) | 250    | +92%  |
| 240 (replan)  | 250    | +4%   |

Measured per file (logical LOC — non-blank, non-comment), original estimate in
brackets: `youtube.js` 107 [55], `test/youtube.test.js` 87 [45],
`test/prompts.test.js` 31 [12], `prompts.js` 10 [10], `config.js` 8 [6],
`hermes-cli.js` 7 [8].

The wiring estimates were accurate to the line. Both overages sit in the new
module and its tests, and both are diagnosed under Simplify Triggers below.

## Anti-Pattern contrasted

`examples/anti-patterns/kitchen-sink-scaffold.md` — the failure mode here would
be shipping a "media extraction subsystem": a provider registry, a cache layer, a
retry policy, and a cookie/proxy configuration surface, all to answer one
question (what is in this video?). The Abstinence List above is that scaffold,
enumerated and declined. What ships is three functions and four constants.

Secondary: `examples/anti-patterns/bloated-loop.md` — `vttToText` is a single
forward pass with one `previous` variable for dedup, not a multi-flag state
machine over cue blocks.

## Simplify Triggers (detected)

**FIRED — Line-Count Budget, +92% against the initial Target of 130.** Two
causes, diagnosed rather than absorbed. Neither is added logic.

1. **Prettier vertical expansion under-budgeted by roughly ten times.** ~62 of
   the 250 lines are one-token-per-line data literals that Prettier explodes:
   the `YOUTUBE_HOSTS` set (8), the `decodeEntities` replace chain (9), the
   yt-dlp argv (19), and in the tests the two `isYouTube` URL lists (12) plus
   the `AUTO_VTT` fixture (14). The `max-turns-cap` task recorded this exact
   failure mode, and this plan explicitly budgeted for it — at 6 lines. The
   lesson carried forward was the right one; the magnitude was not.
2. **The test estimate contradicted the Verification Matrix.** Skill D fixed 20
   rows before coding, 17 of them unit-testable. At the repo's prevailing 4–6
   lines per `test()` block, that is 85–100 lines against a 45-line budget. The
   two artifacts were internally inconsistent from the start; measurement is
   what surfaced it. The tests were not trimmed — cutting coverage to hit a
   number the same session's plan had already contradicted would be the wrong
   correction.

**Cross-check for disguised creep: negative.** Every one of the nine Abstinence
List items is verifiably absent from the diff — no cache, no retry ladder
(`--retries 1` is a yt-dlp flag, not a ladder), no cookie/proxy/PO-token
plumbing, no provider abstraction, no `Transcript` type, no diarisation, no
timestamp modelling, no runtime language config, no runtime probe. The overage
is estimation error, not scope.

**One real cut was found and applied.** `pickTranscript` originally ranked and
sorted caption files by language index. Once `SUBTITLE_LANGS` dropped to two
entries, a rank-and-sort over at most two files was overbuilt; it became a
find-first (`first preferred language that exists, else whatever we got`). Three
lines, and materially clearer. Recorded because it is the only structural
simplification the trigger actually produced — the honest report is that the
budget miss was measurement error, and re-planning to 240 is the correction.

The place flagged at plan time to watch — `vttToText` growing into a conformant
WebVTT parser — held. It is one forward pass with a single `previous` variable
and stayed at 16 logical lines.

## Design change forced by measurement

`SUBTITLE_LANGS` was planned as `fr,fr-en,en` and shipped as `fr,en`. The
end-to-end verification run returned `HTTP Error 429: Too Many Requests` after a
handful of caption fetches — from a **residential** IP, which is the friendlier
of the two cases this feature has to survive. That exposed a flaw in the argv:
yt-dlp downloads _every_ matching track, so a three-entry language list meant two
or three requests per video against the one endpoint that rate-limits, where only
one file is ever read. Dropping `fr-en` halves the request count and improves
quality at the same time, because `fr-en` is a machine translation of a machine
transcription — feeding it to a summariser that then writes French stacks three
lossy steps where the original track stacks one.

