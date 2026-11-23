// rate-limit.js
// In-memory global concurrency cap and per-user sliding-window rate limiter for Hermes calls.
// Zero dependencies, injectable clock for deterministic unit tests, idempotent release().

'use strict';

function createLimiter({
  maxConcurrent = 2,
  maxPerUser = 3,
  windowMs = 60000,
  now = Date.now,
} = {}) {
  let inFlight = 0;
  const userHits = new Map();

  function pruneUser(userId, cutoff) {
    const hits = userHits.get(userId);
    if (!hits) return [];
    const recent = hits.filter((ts) => ts > cutoff);
    if (recent.length === 0) userHits.delete(userId);
    else userHits.set(userId, recent);
    return recent;
  }

  function tryAcquire(userId, { exempt = false } = {}) {
    const current = now();
    const cutoff = current - windowMs;
    const key = String(userId || '');

    if (!exempt) {
      const recent = pruneUser(key, cutoff);
      if (recent.length >= maxPerUser) {
        return { ok: false, reason: 'rate' };
      }
    }

    if (inFlight >= maxConcurrent) {
      return { ok: false, reason: 'concurrency' };
    }

    if (!exempt) {
      const recent = pruneUser(key, cutoff);
      recent.push(current);
      userHits.set(key, recent);
    }

    inFlight += 1;
    let released = false;
    return {
      ok: true,
      release() {
        if (released) return;
        released = true;
        inFlight = Math.max(0, inFlight - 1);
      },
    };
  }

  return {
    tryAcquire,
    stats: () => ({ inFlight, trackedUsers: userHits.size }),
  };
}

module.exports = { createLimiter };
