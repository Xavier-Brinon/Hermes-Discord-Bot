#!/usr/bin/env bash
# lint-mirror.sh — Mirror-contract lint for skills/review.md ↔ review-expert.md.
#
# Asserts that Instructions §1–8 in skills/review.md and
# skills/review-expert.md are byte-identical. Prevents the Phase 4 D3-class
# drift where review-expert.md re-copied review.md's instruction set but
# the mirror was undocumented and unenforced.
#
# See tools/review/README.md for invocation and exit codes. Reference:
# plan_phase_5.org §Task 2 Track 1, phase04_postmortem.org §O8, §D3.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: lint-mirror.sh

No arguments. Resolves skills/review.md and skills/review-expert.md
relative to `git rev-parse --show-toplevel`, so it runs correctly from any
subdirectory of the repo.

Exit codes:
  0  Instructions §1–8 are byte-identical across the mirror pair.
  1  Drift detected — the two files differ in their §1–8 region.
  2  Repo or skill files not found, or other environment error.
EOF
}

die() { echo "error: $*" >&2; exit 2; }

case "${1-}" in
  -h|--help) usage; exit 0 ;;
  "") ;;
  *) echo "unexpected argument: $1" >&2; usage >&2; exit 2 ;;
esac

repo_root=$(git rev-parse --show-toplevel) || die "not inside a git repo"
review="$repo_root/skills/review.md"
expert="$repo_root/skills/review-expert.md"

[ -f "$review" ] || die "$review not found"
[ -f "$expert" ] || die "$expert not found"

# --- Extract Instructions §1–8 from each file ---
# Region starts at the first line matching "^1. " and ends when we hit
# a terminator: "^---$" (expert file separator), "^## Output format$"
# (review.md next heading), or "^9. " (expert file step 9).
extract_steps() {
  awk '
    /^1\. / { p = 1 }
    p {
      if (/^---$/ || /^## Output format$/ || /^9\. /) { exit }
      print
    }
  ' "$1"
}

t_a="/tmp/lint-mirror-$$-a"
t_b="/tmp/lint-mirror-$$-b"
trap 'rm -f "$t_a" "$t_b"' EXIT

extract_steps "$review" > "$t_a"
extract_steps "$expert"  > "$t_b"

if ! diff -q "$t_a" "$t_b" >/dev/null; then
  echo "error: skills/review.md ↔ skills/review-expert.md Instructions §1–8 drift detected" >&2
  diff -u --label "$review" --label "$expert" "$t_a" "$t_b" >&2
  exit 1
fi

exit 0
