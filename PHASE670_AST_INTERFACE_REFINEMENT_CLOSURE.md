# Phase 670 — AST Interface Refinement Closure

Phase 670 raises the AST semantic interface above boolean discriminant requirements plus consumer-side casts.

## Highest interface change

The relational kernel now exposes `relationVariantFold` alongside `relationVariant` and `relationVariantValue`.

A semantic consumer can therefore express:

`subject -> relation variant witness -> typed branch`

without reconstructing a TypeScript `Extract` cast after a relation equality check.

## Migrated semantic frontier

- controller-expression algebra, including ternary / short-ternary / null-coalesce variants
- semantic state/data-flow analysis location and fact variants
- route middleware authorization knowledge
- syntax relation Presence elimination
- generic relational kernel refinement

The rewrite engine remains proof-carrying: typed rewrite candidates consume refinement witnesses rather than recasting the original subject.

## Architectural correspondence

This is deliberately closer to interface-driven IR transformation than parser convenience code: MLIR interfaces decouple transformations from concrete operations and dialect conversion combines rewrite patterns with type conversion; Soufflé models semantic state as typed relations; rewriting-logic systems such as K and Maude treat rewrite rules as semantic machinery. Tree-sitter remains the concrete parsing substrate, not RouteSync's semantic authority.

## Vacuum

The inactive-file vacuum remains clean. Legacy `semanticRelationSolver.ts` and `syntaxErrorRelationCore.ts` remain zero-byte compatibility remnants.

## Verification

- Phase 670 audit: PASS
- Phase 669 audit: PASS
- Phase 668 audit: PASS
- Phase 667 audit: PASS
- Phase 525 inactive-file vacuum: PASS
- targeted TypeScript transpilation: PASS
