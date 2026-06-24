# tools/review/

Reviewer Agent tooling for the `@YackShavingSkill` framework. Three
POSIX bash scripts invoked by the Reviewer Agent (`skills/review.md`)
and the framework itself to produce Adherence Reports and aggregated
metrics mechanically, plus two shared Python3 stdlib modules
(`lib/parse-frontmatter.py`, `lib/parse-report-body.py`) that the scripts
dispatch to for YAML frontmatter and Markdown body parsing.

Reference: `plan_phase_2.org` §Issue 11, ADR `adr_p2_d8_yaml_parsing.org`
(P2.D8), `plan_phase_3.org` §Issue 15 (parser extraction, O2; shellcheck
dependency, O1; `--creation-order` flag, O8), §Issue 13 (metric
aggregation, O4; Decision D3 — POSIX shell wrapper).

## Scripts

### `scope-adherence.sh`

Compute Scope Adherence (formerly Surgical Purity / Diff Purity at file
granularity per Phase 2 Decision D7) by comparing a task's Change Boundary File
Touch List to the actual files changed in git.

```
scope-adherence.sh <task_id> [--commit <sha> | --staged] [--creation-order] [--emit]
```

Reads `.artifacts/<task_id>/change_boundary.md`. Extracts the Path
column of the File Touch List. Runs `git diff --name-only -M90% HEAD`
(uncommitted mode) or `git diff-tree --no-commit-id --name-only -r -M90%
<sha>` (post-commit mode). Computes set differences. Emits an Adherence
Report stub per `schemas/artifacts.md` §6.

The emitted stub has mechanical fields filled (Scope Bleed count,
Scope Adherence %, Artifacts produced list) and semantic fields left
as placeholders for the Reviewer Agent (Skills fired, Reflex Rate,
Complexity Creep count, Style Drift count).

Use `--commit <sha>` for post-commit shakedowns (e.g. the Phase 2 Issue
10 shakedown, where the Change Boundary and the files it governs landed
together in one commit). Omit the flag for live reviewer runs against
uncommitted work.

#### `--creation-order` (Phase 3)

Opt-in cross-check. When supplied together with `--commit`, parses the
Change Boundary's `## Creation Order` block and compares the declared
file sequence against the commit's add-file order (via
`git log --diff-filter=A`). A mismatch appends a `## Warnings` section
to the Adherence Report with a single `⚠ creation_order_deviation:`
row. Per `plan_phase_3.org` Decision D4 this is a **warning, never an
Instant Fail** — the tool cannot distinguish "committer reordered
independent creations for clarity" from "committer silently reordered
prerequisite files", so the Reviewer Agent reads the warning and
decides. Flag is a no-op when the Change Boundary lacks a Creation
Order block.

#### `--staged` (Phase 6)

Authoring-time guardrail. Compares the Change Boundary against the
git index (`git diff --cached --name-only -M90%`) rather than a
committed tree or uncommitted work. Intended for pre-commit hook
integration per `plan_phase_6.org` §Task 1 Track 2.

```
scope-adherence.sh <task_id> --staged
```

Incompatible with `--commit` and `--emit`. Output is **transient**
(stdout only, never written to `.artifacts/<task_id>/adherence_report.md`).
Exits 0 when no scope bleed is detected against the staged paths,
exits 1 with a Violations table when a staged path is not declared in
the Change Boundary. Semantic fields (Skills fired, Reflex Rate, Style
Drift) are left as `?` placeholders because the Reviewer Agent has not
yet run.

Use `--staged` in `.pre-commit-config.yaml` to catch undeclared files
before the commit lands, preserving the canonical single-commit shape
per `phase03_postmortem.org` §O12.

#### `--emit` preservation semantics (Phase 6 / Phase 7 Wave B)

When `--emit` is re-run against an existing `adherence_report.md`, the
tool distinguishes *semantic* cells (preserved byte-identical from the
prior report) from *mechanical* cells (refreshed unconditionally from
the tool's current computation). The authoritative cell-by-cell
classification lives in `schemas/artifacts.md §6 Field-level
semantic/mechanical classification`. Phase 7 Wave B (plan `D3` / `O3`)
moves `Scope Bleed Detail` into the semantic/preserve set so that
reviewer-authored context (e.g., explaining which bleed entries are
false-positive auto-generated paths) survives re-emission. Trailing
`<!-- reviewer note -->` blocks after the final metric line also
preserve (Phase 6 Wave B, `O5`).

### `lint-frontmatter.sh`

Trip-wire linter per ADR P2.D8. Asserts that every artifact's YAML
frontmatter stays flat-scalar, so the Python3-regex parser in
`scope-adherence.sh` does not break silently when the schema evolves.

```
lint-frontmatter.sh <path>
```

Where `<path>` is a directory (recursively scans for `*.md`) or a
single file. Exits 0 if clean, 1 if any violation is found, 2 on
argument errors.

Patterns caught:

| Pattern                             | Example                      |
|-------------------------------------|------------------------------|
| Indented key                        | `  nested_key: value`        |
| Folded/literal block scalar         | `long_text: \|`              |
| Array entry inside frontmatter      | `- first_item`               |
| Nested mapping (key, no same-line value) | `parent:`               |

When this script fires, the Parser Contract declared in
`schemas/artifacts.md` under Common Frontmatter has been broken. The
reviewer must halt, and an engineer must open a successor ADR to P2.D8
(expected target: `yq` Go) before shipping further artifacts.

#### Glob-character lint on File Touch List (O5)

`lint-frontmatter.sh` also invokes `parse-frontmatter.py lint-paths`
per file, which scans the Path column of the `## File Touch List`
table in each `change_boundary.md` for glob characters (`{`, `}`, `*`,
`?`) and fails on any occurrence. Per `phase03_postmortem.org` §O5:
brace-expansion shorthand, wildcards, or other glob characters in
Path cells silently break `parse-frontmatter.py file-touch-list`
(which returns cells as literal strings), causing the downstream
`scope-adherence.sh` Scope Adherence computation to mismatch against the
actual commit's paths. The lint is preventive — catches the next
authoring mistake before it ships.

Warning-class per `plan_phase_3.org` Decision D4 (not Instant Fail);
a future ADR can promote if false-positive data supports.

### `lint-shakedown.sh`

Verification Gate rule per `phase03_postmortem.org` §O4. Walks
`SESSION_LOG.md`, pairs each `# Task: <task_id>` section with its
`### Reflex Audit` value, and for every PASSED task asserts
`.artifacts/<task_id>/adherence_report.md` exists on disk.

```
lint-shakedown.sh
```

No arguments. Resolves `SESSION_LOG.md` and `.artifacts/` relative to
`git rev-parse --show-toplevel`, so it runs correctly from any
subdirectory of the repo. Emits one stderr line per violation in
`<task_id>: reason` format. Exits 0 clean, 1 on violation, 2 on
environment error.

Prevents the Issue 11-class gap where a task declared Reflex Audit
`PASSED` in `SESSION_LOG.md` but never emitted its sibling
`adherence_report.md` (surfaced during Issue 13's aggregator rollout,
backfilled there). Per `plan_phase_3.org` Decision D4 this is a
warning-class gate, not an Instant Fail; `skills/review.md` invokes it
as part of the standard Review-Gate protocol. A future ADR can promote
to Instant Fail if false-positive data supports.

### `aggregate-metrics.sh`

Walk every `.artifacts/*/adherence_report.md` under the repo root and
emit a consolidated `METRICS.md` at the repo root. Four Markdown tables:
Per-task (one row per task), Rollup (totals and means), Violations by
type (Complexity Creep / Scope Bleed / Style Drift sums), and Trend
(Scope Adherence over time, emitted when ≥ 3 reports are present).

```
aggregate-metrics.sh
```

Takes no arguments. Resolves `.artifacts/` relative to
`git rev-parse --show-toplevel`, so it runs correctly from any
subdirectory of the repo. Delegates frontmatter extraction to
`lib/parse-frontmatter.py read-field` and body extraction to the new
sibling `lib/parse-report-body.py` (subcommands `metrics` and
`violations`); both modules are Python3 stdlib only per P2.D8.

Per `plan_phase_3.org` Decision D3, the aggregator is a thin POSIX
shell wrapper — not a Python-native tool — to keep style consistent
with `scope-adherence.sh` and `lint-frontmatter.sh`. Output is Markdown
only: no JSON, no charts, no `METRICS.md` frontmatter (Phase 4 may
ingest `METRICS.md` and add frontmatter at that point).

### `lint-mirror.sh`

Mirror-contract lint. Extracts Instructions §1–8 from
`skills/review.md` and `skills/review-expert.md` and asserts
byte-equality. Prevents the Phase 4 D3-class drift where the Expert
Reviewer re-copied the standard Reviewer's instruction set but the
mirror was undocumented and unenforced.

```
lint-mirror.sh
```

No arguments. Resolves both skill files relative to
`git rev-parse --show-toplevel`. Exits 0 when the two regions match,
1 when drift is detected (a unified diff is emitted to stderr), and
2 on environment errors.

The only current mirror pair is hardcoded; generalising to arbitrary
pairs is deferred per `plan_phase_5.org` Decision D5.

### `lint-precomputation.sh`

Mandatory-for-HIGH lint. Scans every `pre_computation_block.md` under
 the given path and asserts that any artifact carrying a `HIGH`
confidence assumption also contains a `## Verifications` section.

```
lint-precomputation.sh [--since <sha>] <path>
```

Where `<path>` is a directory (recursively scans for
`pre_computation_block.md`) or a single file. The optional
`--since <sha>` flag grandfathers files whose creation commit is a
strict ancestor of `<sha>` — use `b79c02d` (Phase 6 Wave C) as the
policy anchor so the 16 historical pre-anchor PCBs are exempt. Files
with creation commit equal to `<sha>`, descendants of `<sha>`, or
not yet in reachable git history are enforced.

Exits 0 when all checked files are compliant, 1 when at least one
HIGH-rated assumption lacks a matching `## Verifications` section,
and 2 on argument errors.

This lint implements `plan_phase_6.org` Decision D4: HIGH confidence
asserts near-certainty, which should be backed by evidence. MEDIUM
and LOW assumptions are exempt. When this script fires, add the
missing `## Verifications` table with at least one entry documenting
the check command, expected output, actual output, timestamp, and
verdict. The `--since` flag was added in Phase 7 Wave A.1 per `L1`
resolution; the anchor `b79c02d` matches `plan_phase_7.org §O5`'s
forward-scope prose in `schemas/artifacts.md §1`.

### `lint-hooks.sh`

Hook-validation harness for `.pre-commit-config.yaml` `entry:` fields.

Reads the pre-commit config YAML, iterates each `repo: local` hook,
extracts the `entry:` scalar, and asserts (a) no literal XML/HTML
escape sequences appear where bash operators should be, and (b) the
extracted scalar parses cleanly under `bash -n`.

```
lint-hooks.sh [path]
```

Where `[path]` is a `.pre-commit-config.yaml` file (default:
`.pre-commit-config.yaml`).

Exits 0 when all `repo: local` hook `entry:` fields are clean,
1 when at least one escape-byte or bash syntax error is found,
and 2 on invalid arguments or harness failure.

This lint implements `plan_phase_7.org` Decision D2: YAML single-quotes
can silently preserve HTML/XML escape sequences that bash cannot
parse, causing `syntax error near unexpected token` at commit time.
The harness runs `bash -n` on the extracted scalar to surface the
problem before the commit lands.

## Dependencies

- `git` (any modern version)
- `python3` (stdlib only — `re` module; no `pip install` required)
- `bash` 4+ (for associative arrays and `+=` string append)
- `awk`, `sort`, `comm`, `paste`, `wc`, `tr`, `find` (POSIX; preinstalled
  on macOS and every mainstream Linux)
- `shellcheck` ≥ 0.9 (**dev-only**, not a runtime dep; used locally before
  commit per `plan_phase_3.org` Decision D2). Install:
  `brew install shellcheck` on macOS; `apt install shellcheck` on
  Debian/Ubuntu.
- `pre-commit` ≥ 3.0 (**dev-only**, for the local hook integration per
  `phase03_postmortem.org` §O9). Install: `brew install pre-commit` on
  macOS, `pip install --user pre-commit` otherwise; then run
  `pre-commit install` once at the repo root to activate the hooks
  declared in `.pre-commit-config.yaml`. The Radicle workflow has no
  server-side CI; enforcement is local-only.

**No** `yq`. **No** `jq`. **No** `pip install` of runtime deps. **No**
`npm install`. This is a deliberate constraint from P2.D2 and P2.D8;
the `pre-commit` library is a dev tool, not a runtime dependency of
the review scripts themselves.

## Pre-commit hook setup

`.pre-commit-config.yaml` at the repo root declares six `repo: local`
hooks invoking this directory's scripts:

- **lint-frontmatter** — runs `tools/review/lint-frontmatter.sh
  .artifacts/` when any `.artifacts/**/*.md` file is staged. Fails
  the commit on P2.D8 Parser Contract violations (Instant Fail class)
  or O5 glob-character violations in File Touch Lists (warning class,
  still blocks).
- **lint-shakedown** — runs `tools/review/lint-shakedown.sh` when
  `SESSION_LOG.md` or any `adherence_report.md` is staged. Fails the
  commit if any task with Reflex Audit `PASSED` lacks its sibling
  adherence report on disk.
- **lint-mirror** — runs `tools/review/lint-mirror.sh` when any
  `skills/review*.md` file is staged. Fails the commit if
  `skills/review.md` and `skills/review-expert.md` Instructions §1–8
  drift from byte-equality.
- **scope-adherence-staged** — runs `tools/review/scope-adherence.sh
  <task> --staged` when any staged path under `.artifacts/`,
  `tools/review/`, or `.pre-commit-config.yaml` itself is touched.
  Fails the commit if the staged files are not declared in the
  active task's `change_boundary.md`.
- **lint-hooks** — runs `tools/review/lint-hooks.sh
  .pre-commit-config.yaml` when `.pre-commit-config.yaml` itself is
  staged. Fails the commit if any `repo: local` hook `entry:` field
  contains literal XML/HTML escape sequences or bash syntax errors.
- **lint-precomputation** — runs `tools/review/lint-precomputation.sh
  --since b79c02d .artifacts/` when any `.artifacts/**/pre_computation_block.md`
  is staged. Fails the commit if any HIGH-rated assumption lacks a
  `## Verifications` section. The `--since b79c02d` flag grandfathers
  16 pre-anchor historical PCBs so only Phase 6 Wave C (`b79c02d`)
  and later are enforced.

After installing the `pre-commit` library (see Dependencies), run
`pre-commit install` once at the repo root; hooks fire on every
subsequent `git commit`. To run the hooks manually against all files
without committing: `pre-commit run --all-files`.

## Exit codes

All three scripts use the same convention:

| Code | Meaning                                                       |
|------|---------------------------------------------------------------|
| `0`  | Clean pass (or, for `aggregate-metrics.sh`, `METRICS.md` was written). |
| `1`  | Violation detected, or no adherence reports found under `.artifacts/` (`aggregate-metrics.sh`). |
| `2`  | Invalid arguments, missing inputs, unparseable report, or environment error. |

## Rename detection

`scope-adherence.sh` passes `-M90%` to `git diff --name-only`. That means
file renames with ≥90% content similarity are reported as a single new
path, not as an old+new pair. If your change includes a deliberately
large refactor-while-renaming (<90% similarity), both paths will appear
and the tool will flag the old one as scope bleed unless the Change
Boundary declares both.

## Portability notes

- BSD vs GNU `awk`: the scripts use only basic `awk 'NF'` (filter empty
  lines), which is portable.
- `sed -i`: not used. Both scripts are read-only.
- Process substitution (`<(...)`): used in `scope-adherence.sh`. Requires
  `bash`, not `sh`. The shebang is explicit: `#!/usr/bin/env bash`.
- `date -u`: both BSD and GNU `date` support the format string used.

## Shakedown and self-run

Phase 2 Definition of Done requires a shakedown run against Issue 10
(`pi-siblings-scaffold`). The resulting `adherence_report.md` under
`.artifacts/pi-siblings-scaffold/` is the acceptance artifact. That
report is "blind" — the tool was designed without foreknowledge of
Issue 10's artifacts, so the evaluation is credible.

The tool was also sanity-checked against its own Issue 11 artifacts
(`issue-11-verification-gate`). That run is "sighted" — the same author
wrote both the tool and the artifacts, so the report has author bias.
It lives in the working tree as a smoke test, not as acceptance
evidence. Per the Plan agent's credibility-paradox observation: a tool
that can evaluate the task that built it has a bootstrapping bug; a tool
that only evaluates the task that built it has a credibility problem.
Reporting both sides exposes which limit the tool is running against.

## Troubleshooting

**"change_boundary.md not found"** — the task_id is wrong or the artifact
was never produced. For TRIVIAL-tier tasks, no Change Boundary is
required and `scope-adherence.sh` is not the right tool; review manually.

**"Scope Adherence: 100%" but you know the diff touched extra files** —
the Change Boundary was amended after the fact. Check
`git log --follow .artifacts/<task_id>/change_boundary.md` — if the
artifact's most recent commit is *after* the code changes, the Reviewer
Agent's spot-check should flag this as `timestamp suspicious` per
`plan_phase_2.org` Risk R7.

**lint-frontmatter.sh fires unexpectedly** — someone added an array or
nested key to an artifact's frontmatter. Do NOT paper over by loosening
the linter. Open a successor ADR to P2.D8.
