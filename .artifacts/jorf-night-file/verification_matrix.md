---
artifact_type: verification_matrix
task_id: jorf-night-file
timestamp: 2026-10-16T12:55:00Z
complexity_score: 4
complexity_tier: STANDARD
---

## Complexity Score
Scope 2 (4 files) + Ambiguity 1 (issue filter rule refined against data) + Risk 0 (standalone module, not wired) + Knowledge Gap 1 (data explored this session) = **4 → STANDARD**.

## Matrix
| Subtask | Pass criterion | Test case | Outcome |
|---------|----------------|-----------|---------|
| AC1 pure parse/filter on a saved real sample, no network | 10 Oct 2026 night file gives décrets 2026-937..943 in JO order, each with ELI, NOR, ministry | test/jorf.test.js "readNightFile — the 10 Oct 2026 JO…" | PASS |
| AC2 missing file → empty list, not an error | Monday (only evening file) and absent day → null name; fetchJorfFacts → `{ facts: [], attribution: null }` | tests "nightFileName — a day with only an evening file…"; live run for 2026-10-12 | PASS |
| AC3 evening increments ignored | 15 Oct listing with night, midday, evening files → night file only | test "nightFileName — picks the night increment…" | PASS |
| AC4 Licence Ouverte attribution | DILA + file name + date + full URL + licence | test "attribution — …" | PASS |
| Individual measures dropped | unnumbered décret header NUM stays empty despite article NUM | test "parseJorfText — reads the header only…" | PASS |
| Rectificatifs dropped | loi and décret rectificatifs of 10 Oct not in result | fixture test (7 décrets, no 2026-779, no LOI 2026-103) | PASS |
| Paris date | 23:30 UTC 15 Oct → 20261016; winter offset | test "parisYmd — …" | PASS |
| Download errors surface | broken archive rejects | test "readNightFile — a broken archive rejects…" | PASS |
| Live end-to-end | today's file fetched and parsed | `fetchJorfFacts()` on 2026-10-16 → 1 fact (décret 2026-959) + attribution | PASS |
| Completeness over 9 days | kept numbered décrets contiguous | 2026-929..959, no gap | PASS |
| No regression | tests, lint, format | npm test; eslint .; prettier --check . | PASS: 152/152 (+12) |
| Prod: tar + ICU present in node:22 image | run on VPS | PENDING: wiring (2b330be) |
| Issue lifecycle | comment before solve | rad issue show abe7824 | PENDING: merge |
