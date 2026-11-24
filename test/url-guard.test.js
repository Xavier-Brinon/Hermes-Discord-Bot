'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isBlockedIp, checkUrl, findBlockedUrl, filterAllowedUrls } = require('../url-guard');

const fakeLookup = (map) => async (host) => {
  if (!(host in map)) {
    const err = new Error(`ENOTFOUND ${host}`);
    err.code = 'ENOTFOUND';
    throw err;
  }
  return map[host].map((address) => ({ address }));
};

test('isBlockedIp — blocks private, loopback, link-local, metadata, CGNAT and reserved IPv4', () => {
  const blocked = [
    '0.0.0.0',
    '0.1.2.3',
    '10.0.0.1',
    '10.255.255.254',
    '100.64.0.1',
    '100.127.255.254',
    '127.0.0.1',
    '127.0.1.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.254',
    '192.0.0.1',
    '192.0.2.1',
    '192.168.0.1',
    '198.18.0.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
  ];
  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `expected blocked: ${ip}`);
  }
});

test('isBlockedIp — allows public IPv4 addresses including adjacent boundary IPs', () => {
  for (const ip of [
    '1.1.1.1',
    '8.8.8.8',
    '93.184.216.34',
    '100.63.255.255',
    '172.15.255.255',
    '172.32.0.1',
  ]) {
    assert.equal(isBlockedIp(ip), false, `expected allowed: ${ip}`);
  }
});

test('isBlockedIp — blocks loopback, ULA, link-local, multicast, IPv4-mapped and NAT64 IPv6', () => {
  const blocked = [
    '::',
    '::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:169.254.169.254',
    '::ffff:10.0.0.5',
    '64:ff9b::127.0.0.1',
    '64:ff9b:1::1',
    '100::1',
    '2001:db8::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'fe80::1%eth0',
    'ff02::1',
    'not-an-ip',
  ];
  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `expected blocked: ${ip}`);
  }
});

test('isBlockedIp — allows public IPv6 and public IPv4-mapped IPv6', () => {
  for (const ip of ['2606:4700:4700::1111', '2001:4860:4860::8888', '::ffff:93.184.216.34']) {
    assert.equal(isBlockedIp(ip), false, `expected allowed: ${ip}`);
  }
});

test('checkUrl — rejects localhost, local suffixes, non-HTTP schemes, malformed and obfuscated IPs', async () => {
  const lookup = fakeLookup({});
  const cases = [
    ['http://localhost/', 'blocked-host'],
    ['http://localhost:8080/admin', 'blocked-host'],
    ['http://sub.localhost/', 'blocked-host'],
    ['http://printer.local/', 'blocked-host'],
    ['http://metadata.google.internal/computeMetadata/v1/', 'blocked-host'],
    ['http://127.0.0.1:8000/', 'blocked-ip'],
    ['http://0.0.0.0/', 'blocked-ip'],
    ['http://169.254.169.254/latest/meta-data/', 'blocked-ip'],
    ['http://10.0.0.1/', 'blocked-ip'],
    ['http://172.16.0.1/', 'blocked-ip'],
    ['http://192.168.1.1/', 'blocked-ip'],
    ['http://0x7f000001/', 'blocked-ip'],
    ['http://2130706433/', 'blocked-ip'],
    ['http://0177.0.0.1/', 'blocked-ip'],
    ['http://[::1]/', 'blocked-ip'],
    ['http://[::ffff:127.0.0.1]/', 'blocked-ip'],
    ['http://[fe80::1]/', 'blocked-ip'],
    ['http://[fc00::1]/', 'blocked-ip'],
    ['file:///etc/passwd', 'disallowed-scheme'],
    ['ftp://example.com/file', 'disallowed-scheme'],
    ['gopher://127.0.0.1:6379/_INFO', 'disallowed-scheme'],
    ['not a url', 'invalid-url'],
  ];
  for (const [url, expectedReason] of cases) {
    const res = await checkUrl(url, { lookup });
    assert.equal(res.allowed, false, `expected blocked: ${url}`);
    assert.equal(res.reason, expectedReason, `wrong reason for ${url}`);
  }
});

test('checkUrl — validates DNS resolution and rejects mixed public+private dual-stack records', async () => {
  const lookup = fakeLookup({
    'example.com': ['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'],
    'rebind.example': ['93.184.216.34', '127.0.0.1'],
    'internal.example': ['10.20.30.40'],
  });
  assert.deepEqual(await checkUrl('https://example.com/article', { lookup }), {
    allowed: true,
    reason: null,
  });
  assert.deepEqual(await checkUrl('https://rebind.example/x', { lookup }), {
    allowed: false,
    reason: 'blocked-ip',
  });
  assert.deepEqual(await checkUrl('https://internal.example/', { lookup }), {
    allowed: false,
    reason: 'blocked-ip',
  });
  assert.deepEqual(await checkUrl('https://missing.example/', { lookup }), {
    allowed: false,
    reason: 'dns-error',
  });
});

test('findBlockedUrl and filterAllowedUrls — screen prompts and link lists cleanly', async () => {
  const lookup = fakeLookup({ 'lemonde.fr': ['151.101.66.217'] });

  assert.equal(
    await findBlockedUrl('Peux-tu résumer https://lemonde.fr/article.html ?', { lookup }),
    null
  );
  const hit = await findBlockedUrl('Lis http://169.254.169.254/latest/meta-data/', { lookup });
  assert.equal(hit.reason, 'blocked-ip');

  const schemeHit = await findBlockedUrl('Regarde file:///etc/passwd', { lookup });
  assert.equal(schemeHit.reason, 'disallowed-scheme');

  const filtered = await filterAllowedUrls(
    ['https://lemonde.fr/a', 'http://localhost:8080/', 'http://10.0.0.1/'],
    { lookup }
  );
  assert.deepEqual(filtered.allowed, ['https://lemonde.fr/a']);
  assert.equal(filtered.blocked.length, 2);
});

test('entrypoint — findBlockedUrl runs before recap routing and before every askHermes call', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'hermes-discord-bot-clean.js'), 'utf8');
  const guardAt = src.indexOf('findBlockedUrl(content)');
  const recapAt = src.indexOf('isRecapRequest(content');
  const firstAskAt = src.indexOf('await askHermes(');

  assert.ok(guardAt !== -1, 'findBlockedUrl(content) missing from entrypoint');
  assert.ok(recapAt !== -1, 'isRecapRequest(content) missing from entrypoint');
  assert.ok(firstAskAt !== -1, 'askHermes call missing from entrypoint');
  assert.ok(guardAt < recapAt, 'findBlockedUrl must run before recap routing');
  assert.ok(guardAt < firstAskAt, 'findBlockedUrl must run before every askHermes call');
});
