#!/usr/bin/env bash
# lint-frontmatter.sh — ADR P2.D8 trip-wire linter.
#
# Assert that every artifact's YAML frontmatter stays flat-scalar, so the
# Python3-regex parser in scope-adherence.sh (and the Reviewer Agent's
# contract) does not break silently when the schema evolves.
#
# The actual pattern detection lives in tools/review/lib/parse-frontmatter.py
# (`lint` subcommand) per Phase 3 Issue 15. Four patterns trip the wire:
#   - Indented keys
#   - Folded/literal block scalars
#   - Array entries inside frontmatter
#   - Nested mappings (key: with no same-line value)
#
# When this script fires, open a successor ADR to P2.D8 (expected target:
# `yq` Go binary) before any further artifact ships.
#
# See tools/review/README.md for invocation and exit codes.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
lib="$script_dir/lib"

usage() {
  cat <<'EOF'
Usage: lint-frontmatter.sh <path>

Positional:
  path   Directory to search recursively for *.md files, or a single
         *.md file. Each file's YAML frontmatter block (between the
         first two '---' lines) is checked.

Exit codes:
  0  All frontmatter blocks are flat-scalar.
  1  At least one violation found (P2.D8 trip-wire fired).
  2  Invalid arguments or target path missing.
EOF
}

[ $# -eq 1 ] || { usage >&2; exit 2; }

case "$1" in
  -h|--help) usage; exit 0 ;;
esac

target="$1"
[ -e "$target" ] || { echo "error: $target does not exist" >&2; exit 2; }

# Collect files
if [ -d "$target" ]; then
  files=$(find "$target" -type f -name '*.md')
else
  files="$target"
fi

violations=0
while IFS= read -r file; do
  [ -z "$file" ] && continue
  # `|| true` because parse-frontmatter.py exits 1 when violations are
  # detected; that is a successful detection, not a script error. The
  # violation set is signaled by non-empty stdout.
  # P2.D8 Parser-Contract trip-wire:
  result=$(python3 "$lib/parse-frontmatter.py" lint "$file" || true)
  if [ -n "$result" ]; then
    printf '%s\n' "$result"
    violations=$((violations + 1))
  fi
  # phase03_postmortem §O5 glob-character check on File Touch List cells:
  result=$(python3 "$lib/parse-frontmatter.py" lint-paths "$file" || true)
  if [ -n "$result" ]; then
    printf '%s\n' "$result"
    violations=$((violations + 1))
  fi
done <<< "$files"

if [ "$violations" -gt 0 ]; then
  echo "" >&2
  echo "Frontmatter grew a non-flat feature — P2.D8's trip-wire fired." >&2
  echo "Open a successor ADR (expected: yq Go) before shipping further" >&2
  echo "artifacts with this shape." >&2
  exit 1
fi
exit 0
