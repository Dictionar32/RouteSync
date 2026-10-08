# Phase 350 — Relational Authority Cutover

Phase 350 tightens the semantic authority boundary. The canonical layer is audited as a relation/constraint/rewrite boundary; legacy cursor/parser code remains compatibility transport until its consumers are migrated.

## Canonical calculus

candidate → guard → requirement/exclusion → relation closure → fixed point → rewrite → witness

Presence represents absence/presence without sentinel values in the canonical semantic layer. Equality, refinement, projection, selection, expansion and aggregation are relation operations.

## Research basis

The design follows the declarative split visible in WebAssembly validation, MLIR PDLL/DRR pattern matching and rewriting, relational declarations in Soufflé, and the combination of equality saturation with Datalog in egglog. These systems differ substantially in purpose; the common architectural lesson used here is that semantic rules should be represented as constraints/relations and evaluated by a generic engine rather than encoded as ad-hoc host-language control flow.

## Boundary status

The audit deliberately targets only canonical semantic authority files. Legacy `TokenCursor`, delimiter traversal and parser compatibility remain quarantined transport/evaluation mechanisms. They are not counted as eradicated until their consumers are migrated to relational cursor + Presence + syntax evidence relations.
