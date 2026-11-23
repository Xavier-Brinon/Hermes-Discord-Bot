# Security policy

## Reporting a vulnerability

Please report security problems **privately**, through GitHub's
[private vulnerability reporting](https://github.com/Xavier-Brinon/Hermes-Discord-Bot/security/advisories/new)
(Security tab, then "Report a vulnerability"). Do not open a public issue for a
vulnerability.

Useful details: what an attacker can do, the steps or the Discord message that
triggers it, and the commit you looked at.

## Scope

Only the current `main` branch is supported. The bot runs as a single
deployment, so a fix lands on `main` and is deployed from there.

In scope: the bot code in this repository (Discord message handling, the
Hermes CLI wrapper, link summaries, recaps) and the secrets handling
(dotenvx). Out of scope: Discord itself and the upstream Hermes Agent, which
have their own reporting channels.

## Where the project lives

This GitHub repository is the canonical one. Its issue tracker is private, and
pull requests opened on GitHub are not reviewed.
