// url-guard.js
// Bot-side SSRF guard: parses URLs with Node's URL and net.isIP parsers, resolves DNS
// hostnames, and rejects non-HTTP(S) schemes, local hostnames, and private, loopback,
// link-local, metadata, or reserved IPv4/IPv6 ranges before handing a URL to Hermes.

'use strict';

const dns = require('dns');
const net = require('net');

const ANY_URL_PATTERN = /[a-z][a-z0-9+.-]*:\/\/[^\s<>]+/gi;
const ALLOWED_SCHEMES = new Set(['http:', 'https:']);
const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata', 'metadata.google.internal']);
const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal'];

function parseIpv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    value = ((value << 8) | n) >>> 0;
  }
  return value;
}

function isBlockedIpv4(n) {
  const first = n >>> 24;
  const firstTwo = n >>> 16;
  const firstThree = n >>> 8;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (n & 0xffc00000) >>> 0 === 0x64400000 ||
    firstTwo === 0xa9fe ||
    n >>> 20 === 0xac1 ||
    firstThree === 0xc00000 ||
    firstThree === 0xc00002 ||
    firstTwo === 0xc0a8 ||
    (n & 0xfffe0000) >>> 0 === 0xc6120000 ||
    firstThree === 0xc63364 ||
    firstThree === 0xcb0071 ||
    n >>> 28 >= 14
  );
}

function expandIpv6(ip) {
  const bare = ip.split('%')[0].toLowerCase();
  const halves = bare.split('::');
  if (halves.length > 2) return null;

  const parseHalf = (half) => {
    if (!half) return [];
    const tokens = half.split(':');
    const out = [];
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.includes('.')) {
        if (i !== tokens.length - 1) return null;
        const v4 = parseIpv4(tok);
        if (v4 === null) return null;
        out.push(v4 >>> 16, v4 & 0xffff);
      } else {
        if (!/^[0-9a-f]{1,4}$/.test(tok)) return null;
        out.push(parseInt(tok, 16));
      }
    }
    return out;
  };

  const left = parseHalf(halves[0]);
  const right = halves.length === 2 ? parseHalf(halves[1]) : [];
  if (!left || !right) return null;
  if (halves.length === 1) return left.length === 8 ? left : null;
  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...new Array(missing).fill(0), ...right];
}

function isBlockedIpv6(g) {
  const headZero5 = g[0] === 0 && g[1] === 0 && g[2] === 0 && g[3] === 0 && g[4] === 0;
  if (headZero5 && g[5] === 0 && g[6] === 0 && (g[7] === 0 || g[7] === 1)) return true;
  if (headZero5 && g[5] === 0xffff) return isBlockedIpv4(((g[6] << 16) | g[7]) >>> 0);
  if (g[0] === 0x0064 && g[1] === 0xff9b) {
    if (g[2] === 1) return true;
    if (g[2] === 0 && g[3] === 0 && g[4] === 0 && g[5] === 0) {
      return isBlockedIpv4(((g[6] << 16) | g[7]) >>> 0);
    }
  }
  if (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true;
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true;
  if ((g[0] & 0xfe00) === 0xfc00) return true;
  if ((g[0] & 0xffc0) === 0xfe80) return true;
  if ((g[0] & 0xff00) === 0xff00) return true;
  return false;
}

function isBlockedIp(ip) {
  const clean = String(ip || '')
    .trim()
    .split('%')[0];
  const kind = net.isIP(clean);
  if (kind === 4) {
    const v4 = parseIpv4(clean);
    return v4 === null ? true : isBlockedIpv4(v4);
  }
  if (kind === 6) {
    const groups = expandIpv6(clean);
    return groups === null ? true : isBlockedIpv6(groups);
  }
  return true;
}

function normalizeHost(hostname) {
  let host = String(hostname || '').toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  return host.replace(/\.+$/, '');
}

function isBlockedHostname(host) {
  if (!host || BLOCKED_HOSTNAMES.has(host)) return true;
  return BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

async function checkUrl(rawUrl, { lookup = dns.promises.lookup } = {}) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl));
  } catch {
    return { allowed: false, reason: 'invalid-url' };
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { allowed: false, reason: 'disallowed-scheme' };
  }

  const host = normalizeHost(parsed.hostname);
  if (isBlockedHostname(host)) {
    return { allowed: false, reason: 'blocked-host' };
  }

  if (net.isIP(host) !== 0) {
    return isBlockedIp(host)
      ? { allowed: false, reason: 'blocked-ip' }
      : { allowed: true, reason: null };
  }

  let records;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    return { allowed: false, reason: 'dns-error' };
  }

  if (!Array.isArray(records) || records.length === 0) {
    return { allowed: false, reason: 'dns-error' };
  }

  for (const record of records) {
    if (!record || isBlockedIp(record.address)) {
      return { allowed: false, reason: 'blocked-ip' };
    }
  }

  return { allowed: true, reason: null };
}

function extractCandidateUrls(text) {
  const raw = String(text || '').match(ANY_URL_PATTERN) || [];
  return raw.map((u) => u.replace(/[),.;:!?'"]+$/, '')).filter(Boolean);
}

async function findBlockedUrl(text, opts) {
  for (const url of extractCandidateUrls(text)) {
    const res = await checkUrl(url, opts);
    if (!res.allowed) return { url, reason: res.reason };
  }
  return null;
}

async function filterAllowedUrls(urls, opts) {
  const allowed = [];
  const blocked = [];
  for (const url of urls || []) {
    const res = await checkUrl(url, opts);
    if (res.allowed) allowed.push(url);
    else blocked.push({ url, reason: res.reason });
  }
  return { allowed, blocked };
}

module.exports = {
  isBlockedIp,
  isBlockedHostname,
  checkUrl,
  extractCandidateUrls,
  findBlockedUrl,
  filterAllowedUrls,
};
