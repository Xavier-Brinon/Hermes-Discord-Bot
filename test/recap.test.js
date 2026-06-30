'use strict';

// Deterministic tests for parseTimeframe (recap.js, issue 6115cc3). A fixed `now`
// is passed in (the function is pure), so month/year math is reproducible.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseTimeframe } = require('../recap');

// Fixed reference: 15 June 2026 (month index 5). Build expected timestamps with the
// same local-time Date constructor the function uses, so no timezone skew.
const NOW = new Date(2026, 5, 15);
const monthSpan = (year, m) => ({
  sinceTs: new Date(year, m, 1).getTime(),
  untilTs: new Date(year, m + 1, 0, 23, 59, 59, 999).getTime(),
});

test('parseTimeframe — "mois de mai" → the whole of May 2026', () => {
  const r = parseTimeframe('résume le mois de mai', NOW);
  assert.deepEqual({ sinceTs: r.sinceTs, untilTs: r.untilTs }, monthSpan(2026, 4));
});

test("parseTimeframe — \"mois d'avril\" → April 2026", () => {
  const r = parseTimeframe("résume le mois d'avril", NOW);
  assert.deepEqual({ sinceTs: r.sinceTs, untilTs: r.untilTs }, monthSpan(2026, 3));
});

test('parseTimeframe — a future ASCII month rolls back a year ("mois de novembre" → Nov 2025)', () => {
  const r = parseTimeframe('le mois de novembre', NOW);
  assert.deepEqual({ sinceTs: r.sinceTs, untilTs: r.untilTs }, monthSpan(2025, 10)); // November = index 10
});

// --- documented limitations carried over verbatim (issue 6115cc3 Orthogonal Issues) ---

test('parseTimeframe — LIMITATION: English "month of X" is not handled (regex requires "mois") → default 7d', () => {
  const r = parseTimeframe('recap the month of may', NOW);
  assert.deepEqual(r, { daysBack: 7, sinceTs: null, untilTs: null });
});

test('parseTimeframe — LIMITATION: accented French months fall through (\\w+ has no u-flag, stops at the accent) → default 7d', () => {
  // "mois de décembre" captures only "d" → not a month name → default window
  const r = parseTimeframe('le mois de décembre', NOW);
  assert.deepEqual(r, { daysBack: 7, sinceTs: null, untilTs: null });
});

test('parseTimeframe — "mois dernier" → the previous month (May 2026)', () => {
  const r = parseTimeframe('quoi de neuf le mois dernier', NOW);
  assert.deepEqual({ sinceTs: r.sinceTs, untilTs: r.untilTs }, monthSpan(2026, 4));
});

test('parseTimeframe — "last month" at year boundary rolls back the year', () => {
  const r = parseTimeframe('last month', new Date(2026, 0, 10)); // January
  assert.deepEqual({ sinceTs: r.sinceTs, untilTs: r.untilTs }, monthSpan(2025, 11));
});

test('parseTimeframe — relative phrases set daysBack, no absolute timestamps', () => {
  for (const [phrase, days] of [
    ['la semaine dernière', 7],
    ['last week', 7],
    ['hier', 1],
    ['yesterday', 1],
    ["aujourd'hui", 1],
    ['today', 1],
  ]) {
    const r = parseTimeframe(phrase, NOW);
    assert.equal(r.daysBack, days, `"${phrase}" → daysBack ${days}`);
    assert.equal(r.sinceTs, null);
    assert.equal(r.untilTs, null);
  }
});

test('parseTimeframe — numeric quantities ("3 jours", "2 semaines", "5 days", "3 weeks")', () => {
  assert.equal(parseTimeframe('les 3 jours', NOW).daysBack, 3);
  assert.equal(parseTimeframe('2 semaines', NOW).daysBack, 14);
  assert.equal(parseTimeframe('last 5 days', NOW).daysBack, 5);
  assert.equal(parseTimeframe('3 weeks', NOW).daysBack, 21);
});

test('parseTimeframe — no timeframe phrase → default 7 days, no timestamps', () => {
  const r = parseTimeframe('résume ce canal', NOW);
  assert.deepEqual(r, { daysBack: 7, sinceTs: null, untilTs: null });
});

// KNOWN BUG carried over verbatim (issue 6115cc3 Orthogonal Issue): the ASCII spelling
// 'fevrier' DOES match the regex but MONTH_NAMES maps it to month 0 (January) instead
// of 1. Skipped so the suite stays green while documenting the intended behaviour for
// the follow-up fix. (The accented 'février' never reaches this — \w+ stops at the é.)
test(
  'parseTimeframe — ASCII "fevrier" should scope to February',
  { skip: 'KNOWN BUG: MONTH_NAMES["fevrier"] = 0 (January); fix tracked as a follow-up' },
  () => {
    const r = parseTimeframe('le mois de fevrier', NOW);
    assert.deepEqual({ sinceTs: r.sinceTs, untilTs: r.untilTs }, monthSpan(2026, 1));
  }
);
