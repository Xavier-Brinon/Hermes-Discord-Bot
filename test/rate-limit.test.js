'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLimiter } = require('../rate-limit');

test('createLimiter — enforces global concurrency cap and releases cleanly', () => {
  const limiter = createLimiter({ maxConcurrent: 2, maxPerUser: 10, windowMs: 60000 });
  const a = limiter.tryAcquire('u1');
  const b = limiter.tryAcquire('u2');
  const c = limiter.tryAcquire('u3');

  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  assert.deepEqual(c, { ok: false, reason: 'concurrency' });
  assert.equal(limiter.stats().inFlight, 2);

  a.release();
  a.release(); // idempotent
  assert.equal(limiter.stats().inFlight, 1);

  const d = limiter.tryAcquire('u3');
  assert.equal(d.ok, true);
  b.release();
  d.release();
  assert.equal(limiter.stats().inFlight, 0);
});

test('createLimiter — enforces per-user sliding window and resets after windowMs', () => {
  let t = 1000;
  const limiter = createLimiter({ maxConcurrent: 2, maxPerUser: 3, windowMs: 60000, now: () => t });

  for (let i = 0; i < 3; i++) {
    const slot = limiter.tryAcquire('u1');
    assert.equal(slot.ok, true);
    slot.release();
    t += 1000;
  }

  assert.deepEqual(limiter.tryAcquire('u1'), { ok: false, reason: 'rate' });
  // Different user is unaffected
  const other = limiter.tryAcquire('u2');
  assert.equal(other.ok, true);
  other.release();

  // Advance past the oldest hit's 60s window
  t = 61001;
  const after = limiter.tryAcquire('u1');
  assert.equal(after.ok, true);
  after.release();
});

test('createLimiter — admin exemption bypasses per-user window while respecting concurrency', () => {
  const limiter = createLimiter({ maxConcurrent: 2, maxPerUser: 1, windowMs: 60000 });

  for (let i = 0; i < 4; i++) {
    const slot = limiter.tryAcquire('admin', { exempt: true });
    assert.equal(slot.ok, true);
    slot.release();
  }

  const s1 = limiter.tryAcquire('admin', { exempt: true });
  const s2 = limiter.tryAcquire('admin', { exempt: true });
  assert.deepEqual(limiter.tryAcquire('admin', { exempt: true }), {
    ok: false,
    reason: 'concurrency',
  });
  s1.release();
  s2.release();
});

test('createLimiter — concurrency rejection does not burn per-user quota and errors release slots', async () => {
  const limiter = createLimiter({ maxConcurrent: 1, maxPerUser: 1, windowMs: 60000 });
  const busy = limiter.tryAcquire('u1');
  assert.deepEqual(limiter.tryAcquire('u2'), { ok: false, reason: 'concurrency' });
  busy.release();

  // u2 still has its 1 request quota intact
  const s2 = limiter.tryAcquire('u2');
  assert.equal(s2.ok, true);
  try {
    await Promise.reject(new Error('boom'));
  } catch {
    // expected
  } finally {
    s2.release();
  }
  assert.equal(limiter.stats().inFlight, 0);
});
