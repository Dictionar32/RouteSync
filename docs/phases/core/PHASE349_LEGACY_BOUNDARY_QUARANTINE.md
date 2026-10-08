# Phase 349 — Legacy Boundary Quarantine

Semantic authority is now defined only by relational facts, constraints, fixed-point closure, and rewrite closure.

The remaining TokenCursor/parser compatibility code is explicitly classified as transport/decoding boundary code. It must not introduce new semantic decisions. New semantic code must consume:

`RelationalCursor -> Presence -> SyntaxEvidenceRelation -> ConstraintRelation -> FixedPoint -> RewriteClosure`

The next migration removes the compatibility API itself after its consumers have moved to relational witnesses.

## Required lowering

- if/else -> candidate + guard + exclusion
- for/while -> recursive relation + fixed point
- switch -> constructor/catalog relation
- map -> projection
- filter -> selection
- reduce -> aggregation/lattice join
- flatMap -> expansion
- ternary -> guarded candidate + rewrite
- undefined -> Presence/absence witness
- source null -> tagged semantic atom, never erased globally
- ?? -> presence/fallback rewrite
- ===/!== -> canonical equality relation
- as -> refinement witness

## Rule

Compatibility code may transport tokens and source positions, but may not become a semantic authority. Every new semantic rule belongs in the relation program or rewrite catalog.
