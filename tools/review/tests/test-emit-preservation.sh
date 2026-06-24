#!/usr/bin/env bash
# test-emit-preservation.sh — Regression test for scope-adherence.sh --emit
# semantic-field preservation (Phase 6 Wave B, O5).
#
# Creates a temporary git repo with a synthetic task fixture, runs
# scope-adherence.sh --emit against it, and asserts that reviewer-filled
# semantic fields survive while mechanical fields refresh.
#
# Exit 0 on pass, exit 1 on any assertion failure with diagnostic stdout.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
scope_adherence="${script_dir}/../scope-adherence.sh"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

task_id="test-emit-preservation"
task_dir="$tmp/.artifacts/$task_id"
mkdir -p "$task_dir"

# --- Synthetic change boundary ---
cat > "$task_dir/change_boundary.md" <<'EOF'
---
artifact_type: change_boundary
task_id: test-emit-preservation
complexity_score: 3
complexity_tier: STANDARD
---

## File Touch List
| Path | Why | Expected change type |
|------|-----|----------------------|
| foo.txt | test fixture | create |
EOF

# --- Old adherence report with reviewer-filled semantic fields ---
cat > "$task_dir/adherence_report.md" <<'EOF'
---
artifact_type: adherence_report
task_id: test-emit-preservation
timestamp: 2026-04-01T00:00:00Z
complexity_score: 3
complexity_tier: STANDARD
---

## Skills fired
- [x] A  [x] B  [x] C  [x] D  (reviewer fills)

## Artifacts produced
- pre_computation_block: .artifacts/test-emit-preservation/pre_computation_block.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep |     1 | one unused abstraction |
| Scope Bleed      |     0 | All tracked files declared in Change Boundary |
| Style Drift      |     0 | no drift observed |

## Metrics
- Reflex Rate: PASS
- Scope Adherence: 100%

<!-- reviewer note: initial submission; no drift observed -->
EOF

cp "$task_dir/adherence_report.md" "$task_dir/adherence_report.md.orig"

# --- Init temp git repo so scope-adherence.sh can resolve paths ---
cd "$tmp"
git init -q
git add .
git commit -q -m "init"

# --- Run --emit ---
"$scope_adherence" test-emit-preservation --emit

fail=0

# Assert: timestamp refreshed (mechanical)
if grep -q "2026-04-01T00:00:00Z" "$task_dir/adherence_report.md"; then
    echo "FAIL: timestamp not updated"
    fail=1
fi

# Assert: Scope Adherence still 100% (mechanical, but recalculated)
if ! grep -q "Scope Adherence: 100%" "$task_dir/adherence_report.md"; then
    echo "FAIL: Scope Adherence not 100%"
    fail=1
fi

# Assert: Skills fired preserved (semantic)
if ! grep -q '\[x\] A  \[x\] B  \[x\] C  \[x\] D' "$task_dir/adherence_report.md"; then
    echo "FAIL: Skills fired not preserved"
    fail=1
fi

# Assert: Complexity Creep count and detail preserved (semantic)
if ! grep -q 'one unused abstraction' "$task_dir/adherence_report.md"; then
    echo "FAIL: Complexity Creep detail not preserved"
    fail=1
fi

# Assert: Style Drift count and detail preserved (semantic)
if ! grep -q 'no drift observed' "$task_dir/adherence_report.md"; then
    echo "FAIL: Style Drift detail not preserved"
    fail=1
fi

# Assert: Reflex Rate preserved (semantic)
if ! grep -q 'Reflex Rate: PASS' "$task_dir/adherence_report.md"; then
    echo "FAIL: Reflex Rate not preserved"
    fail=1
fi

# Assert: Scope Bleed count refreshed (mechanical) — should be 0
if ! grep -qE '\| Scope Bleed +\|  +0 \|' "$task_dir/adherence_report.md"; then
    echo "FAIL: Scope Bleed count not refreshed to 0"
    fail=1
fi

# Assert: Scope Bleed Detail preserved (semantic, per plan_phase_7.org D3 / O3)
if ! grep -q 'All tracked files declared in Change Boundary' "$task_dir/adherence_report.md"; then
    echo "FAIL: Scope Bleed Detail not preserved"
    fail=1
fi

# Assert: trailing reviewer note preserved (semantic, per phase06_postmortem L3 / O4)
if ! grep -q 'reviewer note: initial submission' "$task_dir/adherence_report.md"; then
    echo "FAIL: trailing reviewer note not preserved"
    fail=1
fi

# Assert: unfilled semantic cells stay as placeholders on first emit
# (This is tested implicitly: we never unfilled them. For a stricter test,
# verify that an old report with placeholders gets new placeholders.)

if [ "$fail" -eq 0 ]; then
    echo "PASS"
    exit 0
else
    echo "--- diff (expected vs actual) ---"
    diff -u "$task_dir/adherence_report.md.orig" "$task_dir/adherence_report.md" || true
    exit 1
fi
