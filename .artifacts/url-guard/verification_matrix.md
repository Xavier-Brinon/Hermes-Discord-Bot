---
artifact_type: verification_matrix
task_id: url-guard
timestamp: 2026-11-23T21:22:30Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| IPv4 special-use & private ranges | `isBlockedIp` returns true for `0.0.0.0`, `127.0.0.1`, `169.254.169.254`, `10.0.0.1`, `172.16.0.1`, `192.168.1.1`, `100.64.0.1`, `224.0.0.1`, `255.255.255.255` and false for public IPs (`1.1.1.1`, `93.184.216.34`, `172.32.0.1`) | `test/url-guard.test.js` IPv4 range cases | PASS |
| IPv6 & IPv4-mapped IPv6 ranges | `isBlockedIp` returns true for `::`, `::1`, `::ffff:127.0.0.1`, `::ffff:7f00:1`, `::ffff:169.254.169.254`, `fe80::1`, `fc00::1`, `fd12::1`, `ff02::1`, `64:ff9b::10.0.0.1` and false for public IPv6 (`2606:4700:4700::1111`) | `test/url-guard.test.js` IPv6 cases | PASS |
| URL parser & obfuscated literals | `checkUrl` rejects `localhost`, `foo.localhost`, `box.local`, `metadata.google.internal`, `http://0x7f000001/`, `http://2130706433/`, `http://0177.0.0.1/`, `file:///etc/passwd`, `ftp://example.com`, malformed URLs | `test/url-guard.test.js` URL & scheme cases | PASS |
| DNS resolution guard | `checkUrl` rejects hostnames resolving to any private/loopback/metadata IP (including dual-stack mixed public+private) and fails closed on DNS errors; allows hostnames resolving only to public IPs | `test/url-guard.test.js` stubbed `lookup` cases | PASS |
| Message & link filtering helpers | `findBlockedUrl` detects blocked URLs (including non-HTTP schemes like `file://`) in message text; `filterAllowedUrls` keeps public URLs and reports blocked ones | `test/url-guard.test.js` helper cases | PASS |
| Entrypoint wiring | Both `messageCreate` (`@mention`/DM) and `summariseLinks` (`📝`) refuse blocked URLs with `messagesFR.linkBlocked` before spawning Hermes | `node -c hermes-discord-bot-clean.js`, `test/modules.test.js`, diff review | PASS |
| No regression | Full unit test suite, eslint, prettier, and frontmatter lint pass | 172/172 non-jorf + 12/12 jorf = 184/184 tests, eslint 0, prettier clean | PASS |
