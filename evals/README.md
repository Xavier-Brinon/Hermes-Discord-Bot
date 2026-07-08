# evals/ — prompt evaluation

Tests the **prompts** the bot sends to Hermes (not the bot's plumbing — that's
`test/`). LLM output is non-deterministic, so these report a **pass-rate over N
runs**, not pass/fail.

Prompts live in `../prompts.js` and are imported here, so an evaluated prompt is
byte-identical to the one that ships. Steering = edit `prompts.js` (or pass a
variant file) and re-run.

## Run the recap eval

```bash
node evals/run-recap-eval.js                 # shipped prompt, 5 runs/fixture
node evals/run-recap-eval.js --runs 10       # more runs = tighter rate
HERMES_BIN=/data/.local/bin/hermes node evals/run-recap-eval.js   # explicit binary
```

Needs the real `hermes` binary and the `discord-bot` profile — the runner sends
`hermes -p discord-bot chat -q <payload> -Q`, the exact call the bot makes for a
recap. Run it wherever `hermes` lives (locally if installed, otherwise on the
VPS / a VPS snapshot).

Output columns:

| Column        | Meaning                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `parseable`   | % of runs where `extractThemes` found ≥1 theme (the bot would render something, not the "no themes" error) |
| `3-5themes`   | % of runs with 3–5 themes (the prompt's "3 à 5 max")                                                       |
| `no-preamble` | % of runs where every non-empty line is a `THEME:` line ("Juste les thèmes")                               |
| `french`      | % of runs whose themes read as French                                                                      |
| `meanThemes`  | average theme count across non-error runs                                                                  |
| `errors`      | runs that errored/timed out                                                                                |

## Steer the recap (A/B a prompt change)

1. Copy the recap prompt into a file and edit it (e.g. force exactly 3, or ask for
   a one-line gloss per theme):
   ```bash
   node -e "console.log(require('./prompts').buildRecapPrompt())" > /tmp/recap-v2.txt
   $EDITOR /tmp/recap-v2.txt
   ```
2. Run both and compare the rates:
   ```bash
   node evals/run-recap-eval.js --runs 10                      # baseline
   node evals/run-recap-eval.js --runs 10 --prompt /tmp/recap-v2.txt
   ```
3. Keep the variant only if it improves compliance without dropping `parseable`
   (a variant that breaks the `THEME:` contract drops `parseable` → the bot would
   show "Je n'ai pas réussi à identifier les thèmes"). Promote a winner by editing
   `prompts.js` — the byte-identity test in `test/` then re-pins it.

## Fixtures

`fixtures/recap/*.txt` are channel-history transcripts. The two committed ones are
synthetic starters. **The most faithful fixtures come from production**: the bot
logs the exact context it sends between `--- HERMES OUTPUT ---` markers in PM2
(`hermes-discord-bot-clean.js`), so mine real recaps from
`pm2 logs hermes-discord-bot` and drop them here as new `.txt` files.

## Known limitations / follow-ups

- **Conservative parsing:** the runner scores raw `-Q` output; the live bot applies
  `unwrapText` first. So `parseable`/`no-preamble` are lower bounds. Full parity
  would need the runner to apply `unwrapText` (text.js) before scoring, as the bot does.
- **Link + Q&A runners** aren't built yet; `assertions.js` already exports
  `hasLinkStructure` / `countQuestions` / `isFrench` for them.
- **LLM-as-judge** (subjective "are these themes representative?") is intentionally
  not coded — add a second `hermes` call with a rubric when needed.
