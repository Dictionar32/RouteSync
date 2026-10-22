# Phase 1631 — Closed Semantic Judgment and Staged Proof Preservation

## Error used as architectural evidence

The previous behavior kernel always ran rewrite closure after constraint closure and returned the rewrite stage's `saturated` flag. If the constraint stage exhausted its round budget, the final result could therefore be marked saturated even though a prerequisite stage had explicitly returned an incomplete judgment. The kernel also returned only rewrite derivations, losing the constraint stage's proof provenance.

## Interface-first correction

- `SemanticBehaviorClosure` is now a discriminated union: `closed` carries a saturated least-fixed-point judgment; `incomplete` carries the failed phase and round-limit reason.
- Constraint-stage incompleteness returns immediately. Rewrite execution cannot convert an incomplete prerequisite into a closed result. The constraint solver now checks the accumulated round count after each iteration and treats a zero-round budget conservatively as incomplete.
- Derivations retain `stage: 'constraint' | 'rewrite'`, and the closure pipeline projects that stage into semantic evidence.
- `SemanticClosureResult` preserves the same closed/incomplete distinction through downstream projection.
- The behavior kernel uses the canonical `semanticRewriteRuntimeExecutor` binding for both constraint and relation operations; no executor was added.

## Verification boundary

The Phase 1631 static audit checks the contract shape, early termination, provenance preservation, and final-stage status propagation. A regression test covers constraint-stage incompleteness and both provenance stages. The test has not been executed in this workspace because dependencies are absent. Run the project test runner, typecheck, and build before claiming complete verification.
