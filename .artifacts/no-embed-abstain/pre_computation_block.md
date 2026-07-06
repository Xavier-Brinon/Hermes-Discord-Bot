---
artifact_type: pre_computation_block
task_id: no-embed-abstain
timestamp: 2026-07-06T06:20:26Z
complexity_score: 2
complexity_tier: STANDARD
---

## Assumptions
| # | Assumption | Confidence |
|---|------------|------------|
| 1 | The abstain permission and the title/author match are orthogonal: an unreadable page should abstain whether or not an embed title exists | HIGH |
| 2 | `summarizeLink` already maps `CONTENU_INACCESSIBLE` → `messagesFR.linkUnreadable`, so no bot-side change is needed — only the prompt must grant the sentinel in the no-meta branch | HIGH |
| 3 | The existing `meta=null byte-identical to no meta` test stays valid because both calls still hit the same (else) branch | HIGH |
| 4 | The existing `byte-identical, context provided` test (prompts.test.js:46) WILL break — the no-meta output now gains the abstain clause — and must be updated in the same commit | HIGH |
| 5 | A conditional clause ("Si tu ne peux pas accéder au contenu réel …") does not force abstention on a readable article — Hermes only emits the sentinel when the antecedent holds | MEDIUM |

## Verifications
| # | command | expected | actual | timestamp | verdict |
|---|---------|----------|--------|-----------|---------|
| 1 | `grep -n "messagesFR.linkUnreadable" hermes-cli.js` | sentinel maps to linkUnreadable in summarizeLink | line 187 `return resolve(messagesFR.linkUnreadable);` | 2026-07-06T06:20:26Z | PASS |
| 2 | `grep -n "LINK_UNREADABLE_SENTINEL" prompts.js` | single sentinel const, no duplicate | defined once (57), used in anchor (75), exported (153) | 2026-07-06T06:20:26Z | PASS |
| 3 | `grep -n "meta=null is byte-identical" test/prompts.test.js` | test compares null vs omitted (both else-branch) | line 68 — stays valid | 2026-07-06T06:20:26Z | PASS |

## Scope Declaration
### Files in scope
- prompts.js — grant the abstain clause unconditionally in `buildLinkPrompt`'s no-meta branch; extract the shared sentinel instruction so the two branches never drift
- test/prompts.test.js — update the now-stale byte-identical no-meta test; add a focused no-embed abstain-path test

### Files off-limits
- hermes-cli.js — `summarizeLink` already maps the sentinel; no change needed (assumption #2)
- config.js — `messagesFR.linkUnreadable` is reused verbatim; no new message
- hermes-discord-bot-clean.js — no call-site change; `summarizeLink` signature unchanged
- text.js / recap.js / cache.js — unrelated to the link-summary prompt
- prompts.js `buildAskPrompt` @mention summary path — a different summary route; the issue scopes only `buildLinkPrompt`
- evals/ — the abstention-reliability eval lives in a separate issue (dbf02a1); out of scope here

## Interpretations of the request
- Primary reading: in the `meta=null` (or no-title) branch, replace `anchor = ''` with a title-free "if you can't read it, abstain with the sentinel" clause — reusing the one existing sentinel, no bot-side change.
- Alternate reading considered: always build the full anchor even without a title (with placeholder identity). Rejected — there is nothing to match against, so the VÉRIFICATION/identity language would be nonsensical and could induce false abstentions.

## Alternatives considered
- Add a second sentinel for the no-embed case — rejected: the issue explicitly says REUSE the existing sentinel; `summarizeLink` keys off exactly one token.
- Move the abstain decision bot-side (post-process a "couldn't read" heuristic) — rejected: no reliable signal in the CLI output; the sentinel is the designed channel.
- Duplicate the full sentinel sentence inline in both branches — rejected: invites drift; extract the shared instruction into one `abstain` fragment instead (Skill B).
