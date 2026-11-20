#!/usr/bin/env bash
# test-parse-report-body-divider.sh — Regression test for
# parse-report-body.py violations divider-guard over-match
# (Phase 9 Wave A, closes phase08_postmortem.org §O5). Asserts
# parser does not silently drop a ## Violations content row
# whose Detail cell contains `---` inside a backtick span.
# Exit 0 on pass, exit 1 on any assertion failure.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
parser="${script_dir}/../lib/parse-report-body.py"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

fixture="$tmp/adherence_report.md"

cat > "$fixture" <<'EOF'
---
artifact_type: adherence_report
task_id: test-parse-report-body-divider
timestamp: 2026-04-24T00:00:00Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Skills fired
- [ ] A
- [ ] B
- [ ] C
- [x] D

## Artifacts produced
- verification_matrix: .artifacts/test/verification_matrix.md

## Violations
| Type             | Count | Detail |
|------------------|-------|--------|
| Complexity Creep | 0     | no creep |
| Scope Bleed      | 0     | no bleed |
| Style Drift      | 0     | used `---` inline code span to reproduce the Phase 8 Wave B incident |

## Metrics
- Reflex Rate: PASS
- Scope Adherence: 100%
EOF

set +e
stdout=$(python3 "$parser" violations "$fixture" 2>&1)
rc=$?
set -e

if [ "$rc" -ne 0 ]; then
    echo "FAIL: parser exit code $rc (expected 0)"
    echo "--- parser output ---"
    echo "$stdout"
    exit 1
fi

if ! echo "$stdout" | grep -qE '^[0-9]+	[0-9]+	[0-9]+$'; then
    echo "FAIL: stdout does not match three-tab-separated-integer shape"
    echo "--- stdout ---"
    echo "$stdout"
    exit 1
fi

echo "PASS"
exit 0
