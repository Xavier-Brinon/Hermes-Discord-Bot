---
artifact_type: pre_computation_block
task_id: url-guard
timestamp: 2026-11-23T21:20:30Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | Node's `URL` parser normalizes obfuscated IPv4 literals (hex `0x7f000001`, decimal `2130706433`, octal `0177.0.0.1`) into dotted IPv4 and wraps IPv6 literals in `[...]` (converting `::ffff:127.0.0.1` to `[::ffff:7f00:1]`). | HIGH |
| 2 | `net.isIP(bareHost)` returns `4` or `6` for IP literals and `0` for DNS hostnames after stripping `[` `]` brackets. | HIGH |
| 3 | Both the `📝` reaction summary flow (`summariseLinks`) and the `@mention` / DM flow (`messageCreate`) are the only bot-side entry points that pass Discord-supplied URLs to Hermes `-t web`. | HIGH |
| 4 | `dns.promises.lookup(host, { all: true, verbatim: true })` returns every A and AAAA record so a dual-stack hostname with any private record is refused. | MEDIUM |
| 5 | Bot-side URL + DNS validation cannot prevent HTTP 302 redirects followed inside Hermes `-t web` or URLs constructed by the model; that layer requires VPS-side Hermes/network egress controls (tracked in follow-up ticket `20261123T211937`). | HIGH |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `node -e "for (const u of ['http://0x7f000001/','http://2130706433/','http://0177.0.0.1/','http://[::ffff:127.0.0.1]/']) console.log(new URL(u).hostname)"` | dotted IPv4 and `[::ffff:7f00:1]` | `127.0.0.1`, `127.0.0.1`, `127.0.0.1`, `[::ffff:7f00:1]` | 2026-11-23T21:20:09Z | PASS |
| 2 | `node -e "const net=require('net'); console.log(net.isIP('127.0.0.1'), net.isIP('::ffff:7f00:1'), net.isIP('fe80::1'))"` | `4 6 6` | `4 6 6` | 2026-11-23T21:20:09Z | PASS |
| 3 | Read `hermes-discord-bot-clean.js` (`messageCreate` and `summariseLinks`) and `hermes-cli.js` | Two user-URL flows (`@mention`/DM and `📝`) | Confirmed: `messageCreate` (lines 397-434) and `summariseLinks` (lines 490-518) | 2026-11-23T21:20:00Z | PASS |
| 5 | Architecture review of `hermes-cli.js` | Hermes runs as a child process with `-t web` and fetches independently | Confirmed: `execFile(HERMES_BIN, [..., '-t', 'web', ...])`; follow-up ticket `20261123T211937` opened | 2026-11-23T21:20:07Z | PASS |

## Scope Declaration
### Files in scope
- `url-guard.js` — new pure module classifying IPv4/IPv6 ranges via `URL`, `net.isIP`, and injectable `dns.promises.lookup`, plus helpers to guard URL lists and message text.
- `config.js` — add `messagesFR.linkBlocked` French refusal message.
- `hermes-discord-bot-clean.js` — reject blocked URLs before calling `askHermes` or `summarizeLink`, and filter scanned channel links.
- `test/url-guard.test.js` — unit tests covering IPv4, IPv6, IPv4-mapped IPv6, obfuscated literals, schemes, local hostnames, DNS results, and message scanning.
- `test/modules.test.js` — module-load smoke check for `url-guard.js` and `messagesFR.linkBlocked`.

### Files off-limits
- `hermes-cli.js` — stays focused on CLI invocation; URL validation happens at the Discord boundary before spawning any child process or yt-dlp.
- `youtube.js` — already hostname-allowlisted to YouTube domains only.
- `jorf.js` — fixed DILA HTTPS endpoint only.
- `prompts.js` — prompt templates unchanged.
- `package.json` — zero new npm dependencies.

## Interpretations of the request
- Primary: reject private, loopback, link-local, metadata, and non-HTTP(S) URLs (including after DNS resolution) at the bot boundary on both `📝` summaries and `@mention` prompts, with a French refusal message and no Hermes invocation; track VPS-side redirect/egress hardening separately (`20261123T211937`).

## Alternatives considered
- Installing an npm IP-parsing package (`ipaddr.js`) — rejected: zero-dependency Node stdlib (`URL`, `net.isIP`, `dns.promises.lookup`) covers IPv4 and IPv6 cleanly in ~75 lines.
- Regex-only hostname denylist — rejected: trivially bypassed by IPv6 compression, IPv4-mapped IPv6, hex/decimal/octal IPv4 literals, or DNS A/AAAA records pointing to private IPs.
- Checking inside `hermes-cli.js` only — rejected: the Discord handler needs to reply cleanly in French with `⚠️` and avoid firing `yt-dlp` or creating pending summary messages for blocked URLs.
