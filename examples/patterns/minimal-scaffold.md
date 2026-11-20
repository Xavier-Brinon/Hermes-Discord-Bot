# Gold Standard: Minimal Scaffold

**Principle:** *"Create exactly what the convention requires."* A new
repo, module, or file should ship with the smallest seed that is still
recognisable — nothing more. Every ancillary file (CI config, hooks,
linter settings, CHANGELOG, LICENSE, a second "architecture" doc) is
its own task, arriving when a concrete need exists.

**Applies when:** You are starting something new — a fresh repo, a new
module boundary inside an existing repo, or the first file for a new
concern.

## Before (naive)

```text
# "Scaffold a new design repo for Pi-Siblings"
new-repo/
├── .github/workflows/ci.yml
├── .husky/{pre-commit, commit-msg}
├── docs/{architecture.md, product-brief.md}
├── examples/
├── scripts/setup.sh
├── tests/smoke.test.sh
├── .editorconfig
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── design.org
└── package.json
```

The ticket said "scaffold a design repo." Look at everything that got
dragged in: CI workflows before there's code, commit hooks before
there's a team, two docs before the design is written, a tests/
directory before there's a unit to test, a LICENSE before the repo is
public. Each item is a legitimate future task — and each is a *now*
risk when it has no concrete user.

## After (gold standard)

```text
# "Scaffold a design repo for Pi-Siblings"
new-repo/
├── .gitignore
└── design.org
```

Two files. `.gitignore` is one line matching the sibling convention.
`design.org` is one document covering the open questions. When the
first implementation commit lands, README, CI, and tests each become
justified by real content.

## Why this is simple

- **The seed matches the phase.** A design-stage repo needs a design
  document and an ignore file, period. The rest is speculation.
- **Every ancillary file carries its own commit.** When README arrives,
  its commit has something to describe. When CI arrives, it runs
  against real code. The history reads like a conversation, not a
  configuration dump.
- **Abstention is cheap once it is written down.** Naming the tempting
  additions in a Pre-Flight Abstinence List ("no CI, no hooks, no
  second design doc") costs thirty seconds and saves the deferred
  debate about whether to delete any of them later.

## Related anti-pattern

See `examples/anti-patterns/kitchen-sink-scaffold.md` for the version
that bundles README + CI + hooks + tests + CHANGELOG + LICENSE on day
one — and the specific failure modes that come with it.
