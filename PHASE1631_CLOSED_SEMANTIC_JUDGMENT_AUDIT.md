# Phase 1631 — Closed Semantic Judgment and Staged Proof Preservation

The canonical behavior kernel now preserves the distinction between a closed judgment and a round-limited judgment. An incomplete constraint stage terminates the pipeline before rewrite execution. Constraint and rewrite derivations retain their stage provenance in the semantic closure result.

## Checks

- PASS — **closed-and-incomplete-are-discriminated-judgments**
- PASS — **constraint-incompleteness-stops-before-rewrite**
- PASS — **constraint-and-rewrite-provenance-are-preserved**
- PASS — **final-status-follows-final-stage-status**
- PASS — **constraint-round-limit-is-enforced-before-recursion**
- PASS — **regression-test-covers-incomplete-and-provenance**

Result: **6/6 checks passed**.

Static audit only. Run the Phase 1631 regression test and the project typecheck/build before claiming full verification.
