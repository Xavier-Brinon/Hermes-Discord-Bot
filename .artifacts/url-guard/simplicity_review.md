---
artifact_type: simplicity_review
task_id: url-guard
timestamp: 2026-11-23T21:20:30Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Simplest Possible Solution
A single zero-dependency module `url-guard.js` using Node's `URL`, `net.isIP`, and injectable `dns.promises.lookup` to reject non-HTTP(S) schemes, local hostnames, and private/loopback/link-local/metadata IPv4 and IPv6 ranges (including IPv4-mapped IPv6). Wired into `hermes-discord-bot-clean.js` right before `askHermes` and `summarizeLink`, replying with `messagesFR.linkBlocked` without spawning Hermes.

## Abstinence List (not added, intentional)
- External IP-range npm library (`ipaddr.js`) — zero-dep bitwise IPv4 + 8-group IPv6 helpers are small, auditable, and avoid adding supply-chain surface.
- Local HTTP proxy inside the bot to intercept Hermes redirects — heavyweight, fragile, and belongs at the VPS/Hermes egress layer (`20261123T211937`).
- Configurable CIDR allowlist/denylist env vars — YAGNI; standard RFC special-use ranges are fixed.
- Caching DNS results in memory — adds staleness/DNS-rebinding risk with no throughput benefit.

## Line-Count Budget
| Target | Actual | Delta |
|--------|--------|-------|
|    195 |    355 |  +160 |

## Simplify Triggers (detected)
- Line-count budget exceeded (+82%: 204 source logical LOC + 151 test logical LOC vs 195 target): expanding IPv6 cleanly without an external npm library (handling `::` compression, embedded IPv4-mapped tails, NAT64, ULA, link-local, and RFC 1918/CGNAT/TEST-NET bitmasks) plus comprehensive unit test fixtures for every RFC special-use range and obfuscation shape required more lines than initially estimated. Kept zero dependencies and avoided `examples/anti-patterns/god-object.md` by isolating the guard in `url-guard.js`.
