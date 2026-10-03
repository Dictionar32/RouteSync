# Phase 383 — Relational Route Resolution Authority

Phase 383 continues the semantic authority migration from Phase 382.

## Cutover

- route constraint flow now uses relation projection + relational accumulation instead of host `for`/`??` bucketing.
- route binding resolution uses Presence folding and relational gates for target/scoping semantics.
- route binding AST adapter normalizes optional syntax through Presence before semantic derivation.
- route group and missing adapters use relational projection/gating.
- route resource semantic resolution uses relation projection, selection, existential relation checks, and relational gates rather than Array map/filter or imperative branching.

## Authority rule

Syntax adapters produce facts. Semantic resolvers derive contracts from facts. Candidate selection and fallback are represented by Presence/relations. Iteration belongs to the relational engine/fixed-point layer, not to semantic host control flow.

## Gate

The Phase 382 AST authority audit is retained and executed as the Phase 383 gate across the 15 canonical authority files. All forbidden constructs are expected to remain zero.
