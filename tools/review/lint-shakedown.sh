#!/usr/bin/env bash
# lint-shakedown.sh — Verification Gate rule per phase03_postmortem.org §O4.
#
# Walk SESSION_LOG.md, pair each `# Task: <task_id>` section with its
# `### Reflex Audit` value (PASSED / FAILED / unknown), and for every
# PASSED task assert that `.artifacts/<task_id>/adherence_report.md`
# exists. Prevents the Issue 11-class gap where a task declares
# Reflex Audit PASSED but never emits its sibling adherence report
# (surfaced during Issue 13's aggregator rollout, backfilled there).
#
# See tools/review/README.md for invocation and exit codes. Reference:
# plan_phase_4.org §Task 3 Track 1, phase03_postmortem.org §O4, §L2.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: lint-shakedown.sh

No arguments. Resolves SESSION_LOG.md and .artifacts/ relative to
`git rev-parse --show-toplevel`, so it runs correctly from any
subdirectory of the repo.

Exit codes:
  0  All PASSED tasks have sibling adherence_report.md on disk.
  1  At least one PASSED task is missing its adherence report.
  2  Repo / SESSION_LOG.md not found, or other environment error.
EOF
}

die() { echo "error: $*" >&2; exit 2; }

case "${1-}" in
  -h|--help) usage; exit 0 ;;
  "") ;;
  *) echo "unexpected argument: $1" >&2; usage >&2; exit 2 ;;
esac

repo_root=$(git rev-parse --show-toplevel) || die "not inside a git repo"
session_log="$repo_root/SESSION_LOG.md"
[ -f "$session_log" ] || die "SESSION_LOG.md not found at $session_log"

# --- Pair each # Task: <id> with its Reflex Audit value ---
# Emits one line per task: <task_id>\t<PASSED|FAILED|unknown>
pairs=$(awk '
  /^# Task: / {
    if (task) print task "\t" reflex
    task = $3
    reflex = "unknown"
    in_reflex = 0
    next
  }
  /^### Reflex Audit[[:space:]]*$/ { in_reflex = 1; next }
  in_reflex && /`PASSED`/  { reflex = "PASSED"; in_reflex = 0; next }
  in_reflex && /`FAILED`/  { reflex = "FAILED"; in_reflex = 0; next }
  END { if (task) print task "\t" reflex }
' "$session_log")

# --- For each PASSED task, assert adherence_report.md exists ---
violations=0
while IFS=$'\t' read -r task reflex; do
  [ -n "$task" ] || continue
  [ "$reflex" = "PASSED" ] || continue
  adherence="$repo_root/.artifacts/$task/adherence_report.md"
  if [ ! -f "$adherence" ]; then
    echo "$task: Reflex Audit PASSED but no adherence_report.md at $adherence"
    violations=$((violations + 1))
  fi
done <<< "$pairs"

if [ "$violations" -gt 0 ]; then
  echo "" >&2
  echo "Shakedown-completeness gate failed: $violations task(s) with" >&2
  echo "Reflex Audit PASSED are missing their sibling adherence_report.md." >&2
  echo "Per phase03_postmortem.org §O4, every PASSED task must emit its" >&2
  echo "adherence report on disk. Re-run tools/review/scope-adherence.sh for" >&2
  echo "each missing task with --emit to backfill, or investigate whether" >&2
  echo "the Reflex Audit value in SESSION_LOG.md is incorrect." >&2
  exit 1
fi
exit 0
