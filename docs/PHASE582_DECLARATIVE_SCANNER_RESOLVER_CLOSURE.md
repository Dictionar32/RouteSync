# Phase 582 — Declarative Scanner/Lexer + Resolver Closure

## Objective

Push the remaining scanner/lexer semantic substrate toward a relation-only model. Host collection state (`Map`/`Set`) and collection combinators are not treated as semantic authority; canonical catalogs and indexes are represented as typed relations and resolved through the relation substrate.

## Research basis

The direction follows the declarative pattern/rewrite architecture documented by MLIR PDLL/PDL/DRR, scope/constraint modeling from Statix, relation/fixpoint execution from Flix/Ascent, and the combination of equality saturation with Datalog in egglog.

## Changes

- Added `relationCatalogValueOr` to the semantic relational sequence substrate for typed tuple-catalog lookup without `Map`.
- Converted Eloquent method catalog to tuple relations.
- Converted Eloquent relation vocabulary and model accessor vocabulary catalogs to tuple relations.
- Converted query evidence operator/method/closure/date/subquery catalogs to tuple relations.
- Converted service AST expression/statement/return-flow catalogs to tuple relations.
- Converted resource-model resolution index to tuple relation data.
- Converted route syntax catalog lookup from `Map` to relation lookup.
- Converted semantic relation solver strata from mutable `Map` to immutable relation tuples and recursive settling.
- Converted semantic relation solver plan index from `Map` to relation tuples.
- Converted interprocedural invocation/callable/emission indexes to relation tuples.
- Converted semantic constraint rule index to relation tuples.
- Converted PHP AST semantic knowledge variable interning index to relation tuples.
- Converted versioned state location/origin indexes to relation tuples.
- Converted semantic operator/relation indexes to relation tuples.
- Converted `SemanticRelationStore` from a class constructed with `new` into a relation-backed closure/factory object.
- Removed `new Error(...)` construction from the route-AST semantic frontier.

## Verification

62 changed/frontier TypeScript files were individually transpiled with TypeScript 5.8.3: **0 diagnostics**.

A TypeScript-AST audit over the 56 production files under `compiler/scanner/lexer/routeAst` reports:

- `if`: 0
- `for`: 0
- `while`: 0
- `switch`: 0
- `.map()`: 0
- `.filter()`: 0
- `.reduce()`: 0
- `.flatMap()`: 0
- `undefined` identifier: 0
- strict equality operators: 0
- `as unknown`: 0
- `new Map` / `new Set`: 0
- `new` expressions: 0

The remaining textual `any` occurrences in that frontier are Laravel/PHP semantic vocabulary values, not TypeScript `any` declarations.

The broader scanner still contains constructor-based domain objects and legacy collection boundaries outside this closed route-AST frontier. Those remain explicit next-pass targets rather than being hidden by a grep-only audit.

A full package build is not claimed here because the checkpoint environment does not contain the project's complete `node_modules`/type-definition closure.
