#!/usr/bin/env python3
"""Shared parser for @YackShavingSkill review artifacts.

Extracted in Phase 3 Issue 15 (O2) so that `scope-adherence.sh` and
`lint-frontmatter.sh` do not carry duplicate inline Python heredocs.
Python3 stdlib only (re, sys); flat-scalar frontmatter invariant per
ADR `adr_p2_d8_yaml_parsing.org`.

Subcommands (each takes a file path as its primary argument):

  read-field <file> <key>   print YAML frontmatter field value; exit 1
                            if the key is absent.
  file-touch-list <file>    print one path per line from the Markdown
                            `## File Touch List` table body; strips
                            inline-code backticks per schemas §3.
  creation-order <file>     print one path per line from the numbered
                            `## Creation Order` block, emitting only
                            steps that contain a backticked path.
  lint <file>               emit P2.D8 trip-wire violations as
                            `path:lineno: kind: content`; exit 1 if any.
  lint-paths <file>         emit `phase03_postmortem.org` §O5 glob-
                            character violations (`{`, `}`, `*`, `?`)
                            in `## File Touch List` Path cells, same
                            output format as `lint`; exit 1 if any.
"""
import re
import sys

_FRONTMATTER_RE = re.compile(r'---\s*\n(.*?)\n---', re.S)
_TOUCH_LIST_RE = re.compile(
    r'^## File Touch List\s*\n(.*?)(?=^## |\Z)', re.M | re.S
)
_CREATION_ORDER_RE = re.compile(
    r'^## Creation Order[^\n]*\n(.*?)(?=^## |\Z)', re.M | re.S
)
_BACKTICKED_PATH_RE = re.compile(r'`([^`]+)`')
_NUMBERED_STEP_RE = re.compile(r'^\d+\.\s+(.*)$')

_LINT_RULES = (
    (re.compile(r'^ +\S+: '), 'indented key'),
    (re.compile(r'^\S+:\s*[|>]\s*$'), 'folded/literal block scalar'),
    (re.compile(r'^\s*- '), 'array entry inside frontmatter'),
    (re.compile(r'^\S+:\s*$'), 'nested mapping (key with no value)'),
)

_GLOB_CHARS_RE = re.compile(r'[{}*?]')


def _read(path):
    with open(path) as f:
        return f.read()


def _frontmatter(text):
    m = _FRONTMATTER_RE.match(text)
    return m.group(1) if m else None


def _strip_backticks(s):
    if len(s) > 1 and s.startswith('`') and s.endswith('`'):
        return s[1:-1].strip()
    return s


def read_field(path, key):
    fm = _frontmatter(_read(path))
    if fm is None:
        return 1
    for line in fm.splitlines():
        if ': ' in line:
            k, v = line.split(': ', 1)
            if k.strip() == key:
                print(v.strip())
                return 0
    return 1


def file_touch_list(path):
    m = _TOUCH_LIST_RE.search(_read(path))
    if not m:
        return 0
    for line in m.group(1).splitlines():
        s = line.strip()
        if not s.startswith('|') or '---' in s:
            continue
        cells = [c.strip() for c in s.strip('|').split('|')]
        if not cells:
            continue
        p = _strip_backticks(cells[0])
        if not p or p.lower() == 'path':
            continue
        print(p)
    return 0


def creation_order(path):
    m = _CREATION_ORDER_RE.search(_read(path))
    if not m:
        return 0
    for line in m.group(1).splitlines():
        step = _NUMBERED_STEP_RE.match(line.strip())
        if not step:
            continue
        pm = _BACKTICKED_PATH_RE.search(step.group(1))
        if pm:
            print(pm.group(1))
    return 0


def lint(path):
    fm = _frontmatter(_read(path))
    if fm is None:
        return 0
    bad = []
    for i, line in enumerate(fm.splitlines(), start=1):
        for pattern, kind in _LINT_RULES:
            if pattern.match(line):
                bad.append((i, kind, line))
                break
    for i, kind, content in bad:
        print(f"{path}:{i}: {kind}: {content}")
    return 1 if bad else 0


def lint_paths(path):
    text = _read(path)
    m = _TOUCH_LIST_RE.search(text)
    if not m:
        return 0
    section_start_line = text[:m.start(1)].count('\n') + 1
    bad = []
    for line_offset, line in enumerate(m.group(1).splitlines()):
        s = line.strip()
        if not s.startswith('|') or '---' in s:
            continue
        cells = [c.strip() for c in s.strip('|').split('|')]
        if not cells:
            continue
        p = _strip_backticks(cells[0])
        if not p or p.lower() == 'path':
            continue
        if _GLOB_CHARS_RE.search(p):
            bad.append((section_start_line + line_offset,
                        'glob character in Path cell', p))
    for i, kind, content in bad:
        print(f"{path}:{i}: {kind}: {content}")
    return 1 if bad else 0


_DISPATCH = {
    'read-field': (read_field, 4),
    'file-touch-list': (file_touch_list, 3),
    'creation-order': (creation_order, 3),
    'lint': (lint, 3),
    'lint-paths': (lint_paths, 3),
}


def main(argv):
    if len(argv) < 3:
        print("usage: parse-frontmatter.py <cmd> <file> [args...]",
              file=sys.stderr)
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
