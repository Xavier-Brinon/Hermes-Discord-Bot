'use strict';

// Deterministic tests for the pure YouTube helpers in youtube.js (issue 7801304).
// No network, no yt-dlp, no Discord — isYouTube and vttToText are both pure.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isYouTube, vttToText } = require('../youtube');

// --- isYouTube ------------------------------------------------------------

test('isYouTube — accepts every shape Discord hands us', () => {
  for (const url of [
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    'https://youtube.com/watch?v=jNQXAC9IVRw&list=PL123',
    'https://youtu.be/jNQXAC9IVRw',
    'https://www.youtube.com/shorts/abc123',
    'https://www.youtube.com/live/abc123',
    'https://m.youtube.com/watch?v=abc123',
    'https://music.youtube.com/watch?v=abc123',
    'http://youtu.be/abc123',
  ]) {
    assert.equal(isYouTube(url), true, url);
  }
});

test('isYouTube — a lookalike host is not YouTube', () => {
  // The reason isYouTube parses the hostname instead of substring-matching: each of these
  // contains "youtube.com" and none of them is YouTube.
  for (const url of [
    'https://notyoutube.com/watch?v=abc',
    'https://youtube.com.phishing.example/watch?v=abc',
    'https://example.com/https://youtube.com/watch?v=abc',
    'https://example.com/?ref=youtube.com',
  ]) {
    assert.equal(isYouTube(url), false, url);
  }
});

test('isYouTube — malformed input is false, never a throw', () => {
  for (const bad of ['', 'not a url', null, undefined, 42, {}]) {
    assert.equal(isYouTube(bad), false);
  }
});

// --- vttToText ------------------------------------------------------------

// A realistic auto-caption sample: metadata header, cue timings with positioning, inline
// karaoke tags, and YouTube's rolling-window repetition.
const AUTO_VTT = `WEBVTT
Kind: captions
Language: fr

00:00:00.030 --> 00:00:02.060 align:start position:0%
bonjour et bienvenue

00:00:02.060 --> 00:00:04.100 align:start position:0%
bonjour et bienvenue
dans cette <00:00:03.100><c>vidéo</c>

00:00:04.100 --> 00:00:06.000 align:start position:0%
dans cette vidéo
nous parlons du sujet
`;

test('vttToText — strips the header, cue timings and inline tags', () => {
  const out = vttToText(AUTO_VTT);
  assert.ok(!out.includes('WEBVTT'));
  assert.ok(!out.includes('Kind:'));
  assert.ok(!out.includes('Language:'));
  assert.ok(!out.includes('-->'));
  assert.ok(!/[<>]/.test(out), `tags survived: ${out}`);
  assert.ok(!out.includes('align:start'));
});

test('vttToText — collapses the rolling-caption repetition', () => {
  const out = vttToText(AUTO_VTT);
  // Each phrase is emitted twice by the rolling window; each must survive exactly once.
  for (const phrase of ['bonjour et bienvenue', 'dans cette vidéo']) {
    assert.equal(out.split(phrase).length - 1, 1, `"${phrase}" not deduped in: ${out}`);
  }
  assert.equal(out, 'bonjour et bienvenue dans cette vidéo nous parlons du sujet');
});

test('vttToText — SRT-style numeric cue indices are dropped', () => {
  assert.equal(vttToText('WEBVTT\n\n1\n00:00:01.000 --> 00:00:02.000\nle texte\n'), 'le texte');
});

test('vttToText — decodes the entities YouTube emits', () => {
  const vtt =
    'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nc&#39;est &quot;a&quot; &amp; b &lt;c&gt;\n';
  assert.equal(vttToText(vtt), 'c\'est "a" & b <c>');
});

test('vttToText — &nbsp; becomes a plain space', () => {
  assert.equal(vttToText('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\na&nbsp;b\n'), 'a b');
});

test('vttToText — empty, null and header-only input give an empty string', () => {
  assert.equal(vttToText(''), '');
  assert.equal(vttToText(null), '');
  assert.equal(vttToText(undefined), '');
  assert.equal(vttToText('WEBVTT\nKind: captions\nLanguage: en\n'), '');
});

test('vttToText — truncates to maxChars', () => {
  const long = `WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n${'a'.repeat(500)}\n`;
  const out = vttToText(long, 100);
  assert.equal(out.length, 100);
});

test('vttToText — a transcript under the cap is returned whole', () => {
  const out = vttToText(AUTO_VTT, 10000);
  assert.equal(out, 'bonjour et bienvenue dans cette vidéo nous parlons du sujet');
});
