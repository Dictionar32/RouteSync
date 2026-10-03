# Phase 583 — Declarative Scanner / Resolver / Analysis Closure

## Goal
Continue the relational cutover beyond route-AST into scanner symbol indexes, controller parser/dataflow boundaries, validation aggregation, model derivation context, and generic forward/backward dataflow solvers.

## Architectural changes
- Introduced `RelationIndex<K,V>` as immutable tuple-backed keyed semantic storage.
- Added relational index lookup/replacement primitives in `relationMembership.ts`.
- Removed host `Map` state from `ModelSymbolTable` and validation root aggregation.
- Removed host `Map` construction from controller parameter semantic propagation; controller parsing now passes relation tuples.
- Removed host `Map` construction from `SemanticDerivationContext.modelsByName`.
- Forward and backward dataflow solvers now return relation-backed state tuples instead of constructing `Map` results.
- Fixed-point termination remains expressed through relation predicates and recursive settlement.

## Research basis
The design is aligned with the declarative pattern/rewrite and relation/constraint ideas documented by MLIR PDLL/PDL, Statix scope-graph constraints, Flix fixpoints, Rascal pattern matching, and egglog's Datalog/equality-saturation combination.

## Verification
- Changed production files transpiled with TypeScript 5.8.3: 0 diagnostics.
- AST audit over changed files: no `if`, `for`, `while`, `switch`, `.map`, `.filter`, `.reduce`, `.flatMap`, `undefined`, `===`/`!==`, `as unknown`, `Set`, or `new` expressions.
- Full package build is not claimed because the checkpoint environment lacks the project's complete dependency/type-definition installation.
