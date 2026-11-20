#!/usr/bin/env python3
"""Body parser for @YackShavingSkill Adherence Reports.

Sibling to `parse-frontmatter.py`. Extracts the required metric values
and the three violation counts from the Markdown body of an
Adherence Report per `schemas/artifacts.md` §6. Python3 stdlib only
(re, sys); invoked by `aggregate-metrics.sh` per `plan_phase_3.org`
§Issue 13 Phase A.

Supports both legacy (dual purity) and current (Scope Adherence) report
formats for backward compatibility with historical reports.

Subcommands (each takes an Adherence Report file path):

  metrics <file>     print `<reflex_rate>\t<scope_adherence>`
                     on a single line. reflex_rate is `PASS` or `FAIL`;
                     scope_adherence is an integer (no `%` suffix).
                     Exit 1 if the `## Metrics` section or any of the
                     required bullets is absent.
  violations <file>  print `<cc>\t<sb>\t<sd>` on a single line, each an
                     integer from the `## Violations` table rows for
                     Complexity Creep, Scope Bleed, and Style Drift.
                     Exit 1 if the section or any required row is
                     absent.
"""
import re
import sys

_METRICS_SECTION_RE = re.compile(
    r'^## Metrics\s*\n(.*?)(?=^## |\Z)', re.M | re.S
)
_VIOLATIONS_SECTION_RE = re.compile(
    r'^## Violations\s*\n(.*?)(?=^## |\Z)', re.M | re.S
)
_REFLEX_RE = re.compile(r'^- Reflex Rate:\s*(PASS|FAIL)\b', re.M)
# Current (Issue #28): Scope Adherence
_SCOPE_RE = re.compile(r'^- Scope Adherence:\s*(\d+)%', re.M)
# Legacy (backward compatibility): Surgical Purity / Diff Purity
_SURGICAL_RE = re.compile(r'^- Surgical Purity:\s*(\d+)%', re.M)
_DIFF_RE = re.compile(r'^- Diff Purity:\s*(\d+)%', re.M)

_VIOLATION_ROWS = ('Complexity Creep', 'Scope Bleed', 'Style Drift')


def _read(path):
    with open(path) as f:
        return f.read()


def metrics(path):
    m = _METRICS_SECTION_RE.search(_read(path))
    if not m:
        print(f"{path}: ## Metrics section not found", file=sys.stderr)
        return 1
    body = m.group(1)
    reflex = _REFLEX_RE.search(body)
    scope = _SCOPE_RE.search(body)
    # Backward compatibility: fall back to legacy patterns
    if not scope:
        surgical = _SURGICAL_RE.search(body)
        diff = _DIFF_RE.search(body)
        # Use whichever legacy pattern matches (they were always equal)
        if surgical:
            scope = surgical
        elif diff:
            scope = diff
    missing = []
    if not reflex:
        missing.append('Reflex Rate')
    if not scope:
        missing.append('Scope Adherence')
    if missing:
        print(f"{path}: ## Metrics missing: {', '.join(missing)}",
              file=sys.stderr)
        return 1
    print(f"{reflex.group(1)}\t{scope.group(1)}")
    return 0


def violations(path):
    m = _VIOLATIONS_SECTION_RE.search(_read(path))
    if not m:
        print(f"{path}: ## Violations section not found", file=sys.stderr)
        return 1
    counts = {name: None for name in _VIOLATION_ROWS}
    for line in m.group(1).splitlines():
        s = line.strip()
        if not s.startswith('|'):
            continue
        cells = [c.strip() for c in s.strip('|').split('|')]
        if cells and cells[0] and all(c in '-:' for c in cells[0]):
            continue
        if len(cells) < 2 or cells[0] not in counts:
            continue
        val = cells[1].strip()
        if val == '?':
            # Reviewer-agent placeholder — treat as 0 pending manual fill
            counts[cells[0]] = 0
        else:
            try:
                counts[cells[0]] = int(val)
            except ValueError:
                print(f"{path}: ## Violations row {cells[0]!r} "
                      f"has non-integer count {val!r}", file=sys.stderr)
                return 1
    absent = [k for k, v in counts.items() if v is None]
    if absent:
        print(f"{path}: ## Violations missing rows: {', '.join(absent)}",
              file=sys.stderr)
        return 1
    print('\t'.join(str(counts[k]) for k in _VIOLATION_ROWS))
    return 0


_DISPATCH = {
    'metrics': (metrics, 3),
    'violations': (violations, 3),
}


def main(argv):
    if len(argv) < 3:
        print("usage: parse-report-body.py <cmd> <file>", file=sys.stderr)
        return 2
    cmd = argv[1]
    if cmd not in _DISPATCH:
        print(f"unknown command: {cmd}", file=sys.stderr)
        return 2
    fn, argc = _DISPATCH[cmd]
    if len(argv) != argc:
        print(f"{cmd}: wrong number of arguments", file=sys.stderr)
        return 2
    return fn(*argv[2:])


if __name__ == '__main__':
    sys.exit(main(sys.argv))
