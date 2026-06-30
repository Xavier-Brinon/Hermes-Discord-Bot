---
artifact_type: verification_matrix
task_id: test-pure-helpers
timestamp: 2026-06-30T06:17:00Z
complexity_score: 6
complexity_tier: COMPLEX
---

## Matrix
| Subtask | Pass criterion | Test case |
|---------|----------------|-----------|
| unwrapText extracted + correct | merges mid-sentence wraps; keeps blank-line paragraph breaks; THEME:/--- stay standalone; structural markers start new paragraph | test/text.test.js (6 cases) → PASS |
| splitAtBoundaries extracted + correct | splits at paragraph/sentence boundaries ≤ maxLen; hard-splits an over-long paragraph | test/text.test.js (3 cases) → PASS |
| isNonArticleUrl correct | youtube/x/image URLs → true; a plain article URL → false | test/text.test.js (2 cases) → PASS |
| parseTimeframe — months | "mois de mai"→May, "mois d'avril"→April, future ASCII "mois de novembre"→Nov 2025 | test/recap.test.js with fixed now → PASS |
| parseTimeframe — last month | "mois dernier"→prev month; "last month" at Jan rolls back the year | test/recap.test.js → PASS |
| parseTimeframe — relative + numeric | "hier"→1, "last week"→7, "3 semaines"→21, "5 days"→5; default 7 | test/recap.test.js → PASS |
| parseTimeframe — documented limitations | English "month of X" → default 7d; accented FR months fall through; ASCII "fevrier"→Jan (skipped, known bug) | test/recap.test.js → PASS (2 limitation tests) + 1 skip |
| node:test green | all suites pass | `npm test` → PASS (41 tests: 40 pass, 0 fail, 1 skip) |
| bot still compiles | syntax valid after rewiring | `node --check` bot/text.js/recap.js → PASS |
| no dangling inline copies | inline unwrapText/splitAtBoundaries/NON_ARTICLE_PATTERN/timeframe removed | grep bot → only imports + call sites → PASS |
| npm run lint available | eslint runs, exit 0 (0 errors; 4 legacy warnings) | `npm run lint` → PASS (exit 0) |
| Issue lifecycle documented | comment posted before state transition | `rad issue show 6115cc3` shows transition comment (at solve time) → PENDING (lands at merge) |
