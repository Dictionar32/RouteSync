# Phase 347 — Relational Authority Cutover

The semantic authority boundary is now organized around relations, not host control constructs.

## Canonical vocabulary

- candidate / guard / requirement / exclusion
- projection / selection / expansion / aggregation
- recursion / fixed-point
- presence / fallback / equality / refinement
- rewrite pattern / rewrite witness / rewrite closure

## External design anchors

WebAssembly specifies validation as declarative typing constraints and execution as reduction rules.
MLIR PDLL separates match sections from rewrite sections and exposes declarative rewrite patterns.
Souffle evaluates recursive relations to fixed points and uses semi-naive deltas.
Flix makes first-class relation constraints and lattice fixed points part of the language model.
Ascent combines recursive relations with user-defined lattices.

RouteSync uses these ideas as architectural constraints, not as copied implementations.

## Cutover rule

`TokenCursor` is compatibility transport only. Semantic consumers must bind absence through
`Presence` / `RelationOption`, produce syntax evidence relations, derive constraints, and let the
constraint/rewrite closure establish semantic witnesses.

No semantic rule may regain authority by reintroducing an imperative branch, sentinel absence,
or host collection combinator.

PHP source `null` remains a semantic atom; only absence of a relation is represented by a presence
witness.
