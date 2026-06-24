#!/usr/bin/env bash
# lint-hooks.sh — Hook-validation harness for .pre-commit-config.yaml entry: fields.
#
# Reads a pre-commit config YAML, iterates each repo: local hook,
# extracts the entry: scalar, and asserts:
#   (a) no literal XML/HTML escape sequences where bash operators should be
#   (b) the extracted scalar parses cleanly under bash -n
#
# Reference: plan_phase_7.org §Task 1 Track 1, phase06_postmortem.org §L1.
# See tools/review/README.md for invocation and exit codes.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: lint-hooks.sh [path]

Positional:
  path   Path to .pre-commit-config.yaml (default: .pre-commit-config.yaml).

Exit codes:
  0  All repo: local hook entry: fields are clean.
  1  At least one violation found (escape-byte or bash syntax error).
  2  Invalid arguments or target path missing / python harness error.
EOF
}

die() { echo "error: $*" >&2; exit 2; }

case "${1-}" in
  -h|--help) usage; exit 0 ;;
esac

[ $# -le 1 ] || { usage >&2; exit 2; }

target="${1:-.pre-commit-config.yaml}"
[ -f "$target" ] || die "$target not found"

set +e
python3 - "$target" <<'PY'
import re
import subprocess
import sys

target = sys.argv[1]
entries = []
current_id = None
in_local = False
in_hooks = False

for line in open(target):
    stripped = line.lstrip()
    indent = len(line) - len(stripped)
    if indent == 2 and stripped.startswith("- repo: local"):
        in_local = True
    elif in_local and indent == 4 and stripped.startswith("hooks:"):
        in_hooks = True
    elif in_hooks and indent == 6 and stripped.startswith("- id:"):
        current_id = stripped.split(":", 1)[1].strip()
    elif in_hooks and indent == 8 and stripped.startswith("entry:"):
        entry = stripped.split(":", 1)[1].strip()
        entries.append((current_id, entry))

entity_re = re.compile(r'&(?:#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);')
violations = 0
for hook_id, entry in entries:
    # Unquote YAML single-quoted scalars
    if entry.startswith("'") and entry.endswith("'"):
        entry = entry[1:-1].replace("''", "'")

    # (a) Literal XML/HTML escape sequence check
    ents = entity_re.findall(entry)
    if ents:
        print(f"{target}: {hook_id}: literal escape sequence(s): {', '.join(ents)}")
        violations += 1

    # (b) Bash syntax check
    result = subprocess.run(["bash", "-n"], input=entry, text=True, capture_output=True)
    if result.returncode != 0:
        err = result.stderr.strip()
        print(f"{target}: {hook_id}: bash syntax error: {err}")
        violations += 1

sys.exit(1 if violations else 0)
PY
py_exit=$?
set -e

case "$py_exit" in
  0) exit 0 ;;
  1) exit 1 ;;
  *) echo "error: python harness failed with exit $py_exit" >&2; exit 2 ;;
esac
