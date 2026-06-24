# Anti-Pattern: Kitchen-Sink Scaffold

**Principle violated:** *"Create exactly what the convention requires."*
**Fix:** Ship only what the phase needs. See
`examples/patterns/minimal-scaffold.md`.

## The Bad Code

```text
# "Scaffold a new design repo for Pi-Siblings"
new-repo/
├── .github/workflows/
│   ├── ci.yml              # runs on push — but there's no code
│   └── release.yml         # runs on tag — but there are no tags
├── .husky/
│   ├── pre-commit          # runs lint-staged — but nothing is linted
│   └── commit-msg          # enforces conventional commits — team of one
├── docs/
│   ├── architecture.md     # 4 lines of "TBD"
│   └── product-brief.md    # duplicates half of design.org
├── examples/               # empty directory
├── scripts/setup.sh        # echoes "installing nothing"
├── tests/smoke.test.sh     # exits 0 unconditionally
├── .editorconfig           # default values, never edited
├── .gitignore
├── CHANGELOG.md            # "# Changelog\n\n- Initial commit"
├── CODE_OF_CONDUCT.md      # copy-pasted template
├── CONTRIBUTING.md         # "PRs welcome" — no PRs accepted yet
├── LICENSE                 # MIT — but the repo is private
├── README.md               # ~200 lines, none of them accurate
├── design.org
└── package.json            # no dependencies, no scripts
```

## Why this is problematic

- **Configuration without users.** Every ancillary file encodes a
  decision ("we use Prettier", "we run CI on push", "we enforce
  conventional commits") made without a concrete user pushing back.
  Half will be wrong by the time a user exists.
- **Review drag from day zero.** Every ancillary file needs review in
  the initial commit. Reviewers cannot tell whether any individual
  piece is load-bearing; the author cannot either.
- **Premature authority.** README states intentions the code does not
  yet honour. CONTRIBUTING invites pull requests the repo cannot
  handle. LICENSE grants rights the repo cannot deliver on. Readers
  treat them as truth anyway.
- **Motion disguised as progress.** Committing sixteen files feels
  productive. The design question the scaffold was created to answer
  is still open.

## How it bloats over time

- **Maintenance.** Each ancillary file drifts. A year later CHANGELOG
  has three entries, none accurate. CI references a node version
  nobody uses. CONTRIBUTING warns about a linter replaced twice.
- **Debugging.** A broken build blames CI. CI blames the pre-commit
  hook. The hook blames lint-staged. None existed because anyone
  needed them; they existed because the scaffold assumed them.
- **Review drag.** A PR that touches `package.json` has a 30% chance of
  triggering an unrelated CI rule written on day zero and never
  revisited.

## The fix

Start with the two-file seed from
`examples/patterns/minimal-scaffold.md`. Grow the ancillary surface
deliberately, one file per commit, each tied to an actual need:

- README arrives with the first external-facing milestone.
- CI arrives when there is code to verify.
- CHANGELOG arrives at the first tagged release.
- LICENSE arrives when the repo is published.

Every added file then carries a rationale its commit message can
defend. A scaffold that passes review is one where every file is
*owed*, not one where every file is *anticipated*.
