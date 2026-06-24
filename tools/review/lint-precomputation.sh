#!/usr/bin/env bash
# lint-precomputation.sh — enforce mandatory-for-HIGH on pre_computation_block.md
#
# When any assumption in a pre_computation_block.md carries a
# confidence: HIGH rating, a matching ## Verifications section must be
# present. Per plan_phase_6.org Decision D4.
#
# With --since <sha>, files whose creation commit is a strict ancestor
# of <sha> are grandfathered (predating the policy anchor). Per
# plan_phase_7.org §Wave A.1 and phase07_postmortem.org L1.
#
# See tools/review/README.md for invocation and exit codes.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: lint-precomputation.sh [--since <sha>] <path>

Positional:
  path            Directory to search recursively for
                  pre_computation_block.md, or a single file.

Options:
  --since <sha>   Grandfather files whose creation commit is a strict
                  ancestor of <sha>. Files with creation commit equal to
                  <sha>, descendants of <sha>, or not yet in reachable
                  git history are enforced.

Exit codes:
  0  All checked pre_computation_block.md files obey mandatory-for-HIGH.
  1  At least one HIGH-rated assumption lacks a ## Verifications section.
  2  Invalid arguments or target path missing.
EOF
}

since=""
target=""

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --since)
      [ $# -ge 2 ] || { echo "error: --since requires a commit sha" >&2; exit 2; }
      since="$2"; shift 2 ;;
    --since=*) since="${1#--since=}"; shift ;;
    --) shift; target="${1:-}"; break ;;
    -*) echo "error: unknown option $1" >&2; usage >&2; exit 2 ;;
    *)
      if [ -z "$target" ]; then
        target="$1"
      else
        echo "error: unexpected argument $1" >&2; exit 2
      fi
      shift ;;
  esac
done

[ -n "$target" ] || { usage >&2; exit 2; }
[ -e "$target" ] || { echo "error: $target does not exist" >&2; exit 2; }

# Normalise --since to full SHA once (before per-file loop)
since_sha=""
if [ -n "$since" ]; then
  since_sha=$(git rev-parse "$since" 2>/dev/null) || {
    echo "error: --since $since is not a valid commit" >&2; exit 2
  }
fi

# Collect files
if [ -d "$target" ]; then
  files=$(find "$target" -type f -name 'pre_computation_block.md')
else
  files="$target"
fi

violations=0
while IFS= read -r file; do
  [ -z "$file" ] && continue

  case "$(basename "$file")" in
    pre_computation_block.md) ;;
    *) continue ;;
  esac

  # Grandfather files whose creation commit is a strict ancestor of SINCE
  if [ -n "$since_sha" ]; then
    creation=$(git log --diff-filter=A --format=%H -1 -- "$file" 2>/dev/null || echo "")
    if [ -n "$creation" ] && [ "$creation" != "$since_sha" ] \
       && git merge-base --is-ancestor "$creation" "$since_sha" 2>/dev/null; then
      # Strict ancestor — grandfathered; skip
      continue
    fi
  fi

  # Check HIGH -> ## Verifications
  if grep -qE '\|\s*HIGH\s*\|' "$file"; then
    if ! grep -qE '^## Verifications' "$file"; then
      echo "$file: HIGH-confidence assumption found but no ## Verifications section"
      violations=$((violations + 1))
    fi
  fi
done <<< "$files"

if [ "$violations" -gt 0 ]; then
  echo "" >&2
  echo "Mandatory-for-HIGH violation detected — add a ## Verifications section" >&2
  echo "backed by check-command evidence. See schemas/artifacts.md §1." >&2
  exit 1
fi
exit 0
