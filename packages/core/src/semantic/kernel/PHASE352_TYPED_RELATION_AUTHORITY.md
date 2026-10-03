# Phase 352 — Typed Relation Authority Cutover

## Objective

Move typed semantic collection evaluation from host-language collection semantics into the
existing declarative relation algebra. This phase is a cutover, not a second parallel API.

## Authority

`semanticTypedRelation.ts` now evaluates projection, selection, expansion, distinctness, and
joins through relation recursion and `RelationOption` witnesses. Absence is represented by an
option witness rather than a host-language absence sentinel.

The resulting semantic chain is:

`evidence → relation → option witness → closure → rewrite`

## Construct elimination

The migrated authority file contains no semantic use of:

- `if`, `for`, `while`, `switch`
- `map`, `filter`, `reduce`, `flatMap`
- `undefined`, `null`, `??`
- `===`, `!==`
- `as`

This does not claim the entire parser compatibility boundary is clean. The remaining legacy
surface is explicitly retained as the next migration frontier, especially `routeSyntaxModel`,
AST evidence adapters, and resource declaration adapters.

## External research basis

The direction is consistent with WebAssembly's declarative validation constraints and formal
reduction rules, MLIR PDLL/DRR match/rewrite separation, Flix relation/lattice fixed points,
and egglog's combination of Datalog with equality saturation.
