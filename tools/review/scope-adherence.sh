#!/usr/bin/env bash
# scope-adherence.sh — Scope Adherence Check for the @YackShavingSkill framework.
#
# Compute Scope Adherence (formerly Surgical Purity / Diff Purity at file
# granularity, per Phase 2 Decision D7) by comparing a task's Change Boundary
# File Touch List
# against the actual files changed in git. Optional --creation-order
# flag adds a warning (per Phase 3 Decision D4) when the declared
# Creation Order does not match the commit's add-file sequence.
#
# See tools/review/README.md for invocation, exit codes, and examples.
# Reference: plan_phase_2.org §Issue 11 Track 2, ADR P2.D8,
# plan_phase_3.org §Issue 15.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
lib="$script_dir/lib"

usage() {
  cat <<'EOF'
Usage: scope-adherence.sh <task_id> [--commit <sha> | --staged] [--creation-order] [--emit]

Positional:
  task_id            Stable task identifier. Expects a Change Boundary at
                     .artifacts/<task_id>/change_boundary.md.

Flags:
  --commit <sha>     Compare against commit <sha>'s tree (post-commit
                     shakedown). Omit to compare against uncommitted
                     changes from HEAD.
  --staged           Compare against the git index (staging area) instead
                     of a committed SHA or uncommitted work. For authoring-
                     time / pre-commit guardrails. Incompatible with
                     --commit and --emit; output is transient only.
  --creation-order   Cross-check the declared Creation Order block against
                     the commit's add-file sequence. Requires --commit.
                     Emits a warning on mismatch (never an Instant Fail —
                     see plan_phase_3.org Decision D4).
  --emit             Write the Adherence Report to
                     .artifacts/<task_id>/adherence_report.md.
                     Preserves reviewer-filled semantic fields from
                     an existing report. Default: stdout.
  --legacy-output    Emit deprecated metric labels (Surgical Purity/Diff Purity)
                     for backward compatibility. Not recommended.
  -h, --help         Show this help and exit.

Exit codes:
  0  No scope bleed detected.
  1  Scope bleed present (see the emitted Violations table).
  2  Required input missing or invalid arguments.
EOF
}

die() { echo "error: $*" >&2; exit 2; }

task_id=""
commit_sha=""
emit=0
staged=0
creation_order_check=0

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --commit)
      [ $# -ge 2 ] || die "--commit requires an argument"
      commit_sha="$2"
      shift 2
      ;;
    --staged) staged=1; shift ;;
    --creation-order) creation_order_check=1; shift ;;
    --emit) emit=1; shift ;;
    --) shift; break ;;
    -*) echo "unknown flag: $1" >&2; usage >&2; exit 2 ;;
    *)
      if [ -z "$task_id" ]; then
        task_id="$1"
        shift
      else
        die "unexpected argument: $1"
      fi
      ;;
  esac
done

[ -n "$task_id" ] || { usage >&2; die "task_id is required"; }
if [ "$staged" -eq 1 ] && [ -n "$commit_sha" ]; then
  die "--staged is incompatible with --commit"
fi
if [ "$creation_order_check" -eq 1 ] && [ -z "$commit_sha" ]; then
  die "--creation-order requires --commit"
fi
if [ "$staged" -eq 1 ] && [ "$emit" -eq 1 ]; then
  # --emit is silently ignored in staged mode; output is always transient.
  emit=0
fi

repo_root=$(git rev-parse --show-toplevel) || die "not inside a git repo"
task_dir="$repo_root/.artifacts/$task_id"
cb_file="$task_dir/change_boundary.md"

[ -f "$cb_file" ] || die "change_boundary.md not found at $cb_file"

# --- Parse declared paths from the File Touch List ---
declared_paths=$(python3 "$lib/parse-frontmatter.py" file-touch-list "$cb_file")

# --- Get actual paths from git ---
if [ "$staged" -eq 1 ]; then
  actual_paths=$(git diff --cached --name-only -M90%)
elif [ -n "$commit_sha" ]; then
  actual_paths=$(git diff-tree --no-commit-id --name-only -r -M90% \
    "$commit_sha")
else
  # -M90%: detect renames at >=90% similarity; one path per rename.
  actual_paths=$(git diff --name-only -M90% HEAD)
fi

complexity_score=$(python3 "$lib/parse-frontmatter.py" read-field \
  "$cb_file" complexity_score)
complexity_tier=$(python3 "$lib/parse-frontmatter.py" read-field \
  "$cb_file" complexity_tier)

# --- Set arithmetic (scope_bleed = actual - declared) ---
declared_sorted=$(printf '%s\n' "$declared_paths" | awk 'NF' | sort -u)
actual_sorted=$(printf '%s\n' "$actual_paths" | awk 'NF' | sort -u)

scope_bleed=$(comm -23 \
  <(printf '%s\n' "$actual_sorted") \
  <(printf '%s\n' "$declared_sorted"))

actual_count=$(printf '%s\n' "$actual_sorted" | awk 'NF' | wc -l | tr -d ' ')
scope_bleed_count=$(printf '%s\n' "$scope_bleed" | awk 'NF' | wc -l | tr -d ' ')

# --- Metric: Scope Adherence (Phase 2: formerly Surgical Purity/Diff Purity, per P2.D7) ---
if [ "$actual_count" -eq 0 ]; then
  scope_adherence=100
else
  scope_adherence=$(( 100 - (scope_bleed_count * 100 / actual_count) ))
fi

# --- Creation Order cross-check (opt-in; Phase 3 Decision D4: warning only) ---
creation_order_warning=""
if [ "$creation_order_check" -eq 1 ]; then
  declared_order=$(python3 "$lib/parse-frontmatter.py" creation-order "$cb_file")
  if [ -n "$declared_order" ]; then
    actual_add=$(git log --diff-filter=A --name-only --pretty=format: \
      "${commit_sha}^..${commit_sha}" | awk 'NF')
    # Keep only paths that appear in the declared order, preserving git's
    # emit order; then compare the two sequences verbatim.
    filtered=$(printf '%s\n' "$actual_add" | awk -v d="$declared_order" '
      BEGIN { n = split(d, a, "\n"); for (i = 1; i <= n; i++) want[a[i]] = 1 }
      want[$0]
    ')
    if [ "$declared_order" != "$filtered" ]; then
      dcsv=$(printf '%s' "$declared_order" | paste -sd, -)
      acsv=$(printf '%s' "$filtered" | paste -sd, -)
      creation_order_warning="⚠ creation_order_deviation: declared [${dcsv}]; actual [${acsv}]"
    fi
  fi
fi

# --- Build the Artifacts produced list ---
artifacts_list=""
for t in pre_computation_block simplicity_review change_boundary \
         verification_matrix; do
  if [ -f "$task_dir/$t.md" ]; then
    artifacts_list+="- ${t}: .artifacts/${task_id}/${t}.md"$'\n'
  fi
done
artifacts_list=${artifacts_list%$'\n'}

# --- Scope bleed detail ---
if [ "$scope_bleed_count" -gt 0 ]; then
  scope_detail=$(printf '%s\n' "$scope_bleed" | awk 'NF' | paste -sd, -)
else
  scope_detail="—"
fi

now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Emit the Adherence Report ---
warnings_section=""
if [ -n "$creation_order_warning" ]; then
  warnings_section=$'\n\n## Warnings\n'"- $creation_order_warning"
fi

report=$(cat <<EOF
---
artifact_type: adherence_report
task_id: $task_id
timestamp: $now
complexity_score: $complexity_score
complexity_tier: $complexity_tier
---

## Skills fired
- [?] A  [?] B  [?] C  [?] D  (reviewer-agent fills from Pre-Flight)

## Artifacts produced
$artifacts_list

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     ? | reviewer-agent fills |
| Scope Bleed      |     $scope_bleed_count | $scope_detail |
| Style Drift      |     ? | reviewer-agent fills |

## Metrics
- Reflex Rate: PASS | FAIL (reviewer-agent fills from Post-Flight audit)
- Scope Adherence: ${scope_adherence}%${warnings_section}
EOF
)

merged_report="$report"
if [ "$emit" -eq 1 ] && [ -f "$task_dir/adherence_report.md" ]; then
  merged_report=$(printf '%s\n' "$report" | python3 -c '
import sys

def load(path):
    with open(path) as f:
        return f.read().splitlines()

old_path = sys.argv[1]
new_lines = sys.stdin.read().splitlines()
old_lines = load(old_path)

SKILLS_TMPL = "- [?] A  [?] B  [?] C  [?] D  (reviewer-agent fills from Pre-Flight)"
REFLEX_TMPL = "- Reflex Rate: PASS | FAIL (reviewer-agent fills from Post-Flight audit)"

def is_placeholder_table(line, label):
    parts = [p.strip() for p in line.split("|")]
    return len(parts) >= 4 and parts[2] == "?" and parts[3] == "reviewer-agent fills"

old_skills = None
old_complexity = None
old_style = None
old_reflex = None
old_bleed_detail = None

for line in old_lines:
    if line.startswith("- [") and line != SKILLS_TMPL:
        old_skills = line
    elif "| Complexity Creep" in line and not is_placeholder_table(line, "Complexity Creep"):
        old_complexity = line
    elif "| Style Drift" in line and not is_placeholder_table(line, "Style Drift"):
        old_style = line
    elif line.startswith("- Reflex Rate:") and line != REFLEX_TMPL:
        old_reflex = line
    elif "| Scope Bleed" in line:
        # Scope Bleed count is mechanical (refresh); Detail is semantic (preserve).
        # Per schemas/artifacts.md §6 Field-level classification + plan_phase_7.org D3.
        parts = line.split("|")
        if len(parts) >= 4:
            old_bleed_detail = parts[3]

for i, line in enumerate(new_lines):
    if line.startswith("- [") and old_skills is not None:
        new_lines[i] = old_skills
    elif "| Complexity Creep" in line and old_complexity is not None:
        new_lines[i] = old_complexity
    elif "| Style Drift" in line and old_style is not None:
        new_lines[i] = old_style
    elif line.startswith("- Reflex Rate:") and old_reflex is not None:
        new_lines[i] = old_reflex
    elif "| Scope Bleed" in line and old_bleed_detail is not None:
        parts = line.split("|")
        if len(parts) >= 4:
            parts[3] = old_bleed_detail
            new_lines[i] = "|".join(parts)

# Preserve any trailing reviewer notes (lines after last "- Scope Adherence:")
adherence_idx = None
for i, line in enumerate(old_lines):
    if line.startswith("- Scope Adherence:"):
        adherence_idx = i
if adherence_idx is not None and adherence_idx + 1 < len(old_lines):
    new_lines.extend(old_lines[adherence_idx + 1:])

print("\n".join(new_lines))
' "$task_dir/adherence_report.md")
fi

if [ "$emit" -eq 1 ]; then
  printf '%s\n' "$merged_report" > "$task_dir/adherence_report.md"
  echo "wrote $task_dir/adherence_report.md" >&2
else
  printf '%s\n' "$merged_report"
fi

if [ "$scope_bleed_count" -gt 0 ]; then
  exit 1
fi
exit 0
