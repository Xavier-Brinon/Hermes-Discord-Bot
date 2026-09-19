// youtube.js
// YouTube caption retrieval for the link summariser (issue 7801304). `-t web` cannot read a
// YouTube watch page, so before this module a 📝 on a video either abstained via
// CONTENU_INACCESSIBLE or was summarised from the Discord embed's title/author alone — the
// video's actual content was invisible. Here we pull the caption track with yt-dlp and hand the
// prose to buildLinkPrompt as one more ground-truth anchor.
//
// Why yt-dlp and not a transcript library or a headless browser: YouTube rotates which of its
// player clients demand a Proof-of-Origin token, and yt-dlp tracks that rotation (the spike for
// this issue watched it fall back to the `visionos` client to get captions). Anything calling
// /api/timedtext directly breaks on the next rotation. A headless browser answers client
// attestation, which is not the failure mode that matters here — see fetchTranscript.
//
// Everything degrades to null. A null transcript makes buildLinkPrompt emit exactly the string
// it emitted before this feature existed, so every failure path lands on the pre-existing
// embed-anchored behaviour rather than on an error.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { YTDLP_BIN, TIMEOUT_TRANSCRIPT, SUBTITLE_LANGS, TRANSCRIPT_MAX_CHARS } = require('./config');

// Hosts whose URLs carry a single watchable video. Membership-tested against a parsed hostname
// rather than matched with a regex on purpose: a substring test says yes to `notyoutube.com` and
// to `youtube.com.phishing.example`, both of which would send us fetching an attacker-chosen URL.
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

// True when `url` points at a YouTube video. Covers every shape Discord hands us — /watch?v=,
// the youtu.be short form, /shorts/, /live/, and the m./music. subdomains — because it tests the
// host, not the path. Malformed input is false, never a throw: the caller feeds it raw strings
// pulled out of message text by extractLinks.
function isYouTube(url) {
  try {
    return YOUTUBE_HOSTS.has(new URL(String(url)).hostname.toLowerCase());
  } catch {
    return false;
  }
}

// VTT metadata and cue-block scaffolding — the lines that carry no prose.
const VTT_NOISE = /^(?:WEBVTT\b|Kind:|Language:|NOTE\b|STYLE\b|REGION\b)/;

// The handful of entities YouTube actually emits in caption text. &amp; is decoded LAST so an
// escaped entity like `&amp;lt;` survives as the literal `&lt;` instead of being decoded twice.
function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// WebVTT → plain prose, truncated to `maxChars`. Deliberately NOT a WebVTT parser: the job is to
// delete everything that is not speech — the header block, cue timing lines, SRT-style cue
// indices, and the inline `<00:00:01.234><c>word</c>` karaoke tags auto-captions are full of.
//
// The dedup against `previous` is what makes auto-captions readable. YouTube emits them as a
// rolling window, so each cue repeats the tail of the one before it and a naive join produces
// every phrase two or three times — which would both waste the character budget and lead the
// summariser to read repetition as emphasis. Pure; unit-tested.
function vttToText(vtt, maxChars = TRANSCRIPT_MAX_CHARS) {
  const out = [];
  let previous = '';
  for (const raw of String(vtt || '').split('\n')) {
    const line = raw.trim();
    if (!line || VTT_NOISE.test(line) || line.includes('-->') || /^\d+$/.test(line)) continue;
    const text = decodeEntities(line.replace(/<[^>]*>/g, ''))
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text === previous) continue;
    out.push(text);
    previous = text;
  }
  const joined = out.join(' ');
  return joined.length > maxChars ? joined.slice(0, maxChars).trimEnd() : joined;
}

// Run yt-dlp for `url`, writing subtitle files into `dir`. execFile, never exec — the URL comes
// from a Discord message, and no shell means no command injection (AGENTS.md).
function runYtDlp(url, dir) {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_BIN,
      [
        // The bot's container is node:22 and yt-dlp needs a JS runtime to solve YouTube's player
        // challenges; without this it warns that extraction is deprecated and drops formats.
        // Node is present by construction, so it is named outright rather than probed for.
        '--js-runtimes',
        'node',
        '--skip-download',
        // Human-authored subtitles when the uploader provided them, machine ones otherwise.
        '--write-subs',
        '--write-auto-subs',
        '--sub-langs',
        SUBTITLE_LANGS,
        '--sub-format',
        'vtt',
        // A shared link often carries `&list=`; without this, yt-dlp would walk the whole
        // playlist and turn one 📝 into hundreds of requests.
        '--no-playlist',
        '--no-warnings',
        '--no-progress',
        '--retries',
        '1',
        '-o',
        path.join(dir, 'cap'),
        url,
      ],
      { timeout: TIMEOUT_TRANSCRIPT, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) =>
        error ? reject(new Error(stderr || error.message)) : resolve(stdout)
    );
  });
}

// Best caption file in `dir` as prose, or null when yt-dlp wrote none. "Best" is the first
// SUBTITLE_LANGS entry that actually got written — yt-dlp names them `cap.<lang>.vtt` — falling
// back to whatever single track exists if the suffix is unrecognised.
function pickTranscript(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.vtt'));
  if (files.length === 0) return null;
  const best =
    SUBTITLE_LANGS.split(',')
      .map((lang) => files.find((f) => f.endsWith(`.${lang}.vtt`)))
      .find(Boolean) || files[0];
  return vttToText(fs.readFileSync(path.join(dir, best), 'utf8')) || null;
}

// The transcript behind `url`, or null. Null is a normal outcome, not an exception: a non-YouTube
// link, a video with captions disabled, a missing yt-dlp binary, a timeout, and a hard block from
// YouTube all land here, and every one of them degrades the summary to the embed-anchored
// behaviour that predates this feature.
//
// Known residual risk: YouTube scores source IPs, and datacenter ranges — which is what the VPS
// is — are penalised far more aggressively than residential ones. The spike proving this path
// ran from a residential IP. If production returns null for every video, that block is the first
// thing to check; the issue records the fallback ladder (cookies, PO-token provider, residential
// proxy, hosted API).
async function fetchTranscript(url) {
  if (!isYouTube(url)) return null;
  let dir;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ytcap-'));
  } catch {
    return null;
  }
  try {
    await runYtDlp(url, dir);
    const text = pickTranscript(dir);
    console.log(text ? `📝 Transcript: ${text.length} chars` : '📝 No transcript available');
    return text;
  } catch (e) {
    console.error(`⚠️  Transcript fetch failed: ${e.message.split('\n')[0]}`);
    return null;
  } finally {
    // Both paths, always — a per-fetch temp dir left behind would accumulate under a
    // long-running PM2 process.
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = { isYouTube, vttToText, fetchTranscript };
