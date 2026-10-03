# Phase 634 — Scanner / Graph Resolver / AST / Analysis Relational Cutover

## Scope

This phase continues the RouteSync compiler-style semantic architecture from Phase 633.
The focus is the remaining frontier identified in the scanner/lexer, graph resolver, AST/upstream mapping boundary, analysis solver, and lowering boundary.

## Research basis

The design follows the same higher-order compiler principles found in:

- MLIR Dialect Conversion: conversion targets, rewrite patterns, and type conversion separate legality from transformation.
- MLIR Canonicalization / Pattern Rewriter: repeated rewrites converge toward a stable form and semantic information must remain recoverable.
- Soufflé: relations form the semantic domain; recursive SCCs are evaluated to a fixed point.
- egglog: equality saturation and Datalog-style reasoning can share one relational engine.
- K: executable semantics can be expressed as configurations plus rewrite rules.
- Flix: Datalog constraints and lattice fixed points provide a declarative analysis model.

## Changes

### 1. Scanner lexer token accumulation

`packages/core/src/compiler/scanner/lexer/tokenizer.ts`

- `ScanAction` now consumes an immutable token relation and returns the next immutable relation.
- Token actions no longer own a mutable token accumulator.
- Dispatch remains a lexical evidence mechanism, while semantic interpretation remains outside the tokenizer.
- Recursive scan closure is retained as the execution mechanism for lexical evidence acquisition.

This keeps the lexer below the semantic authority boundary: source syntax is evidence, not semantic truth.

### 2. Graph resolver

`packages/core/src/semantic/plugins/ResourceGraphResolver.ts`

- Resource resolution is represented by a closed rule catalog.
- Rule witnessing is centralized through the relation engine.
- Resource cardinality and provenance are produced from the witnessed rule rather than duplicated branching logic.
- Resource-name suffix recognition uses the relational text predicate instead of direct string-method semantics.

### 3. Analysis solver

`packages/core/src/compiler/analysis/dataflow/forwardSolver.ts`

- Removed the solver-local recursive `settle` implementation and hard-coded round boundary.
- Forward analysis now delegates convergence to the canonical `relationFixedPoint` engine.
- The analysis layer therefore exposes transfer + merge + equality as the semantic algebra and delegates iteration to the shared fixed-point machinery.

### 4. AST/upstream boundary

No source PHP constructs such as ternary, null-coalesce, `null`, `===`, or `any` were blindly removed from the AST evidence vocabulary.
They remain source-language evidence where required. The semantic boundary is instead kept above that evidence through relation-driven mapping and upstream canonicalization.

## Validation

- TypeScript parser diagnostics for all three changed files: **0 parse errors**.
- Targeted forbidden-host-control scan over changed scanner/graph/analysis files: **0 matches** for `if`, `while`, `for`, `switch`, `.map`, `.filter`, `.reduce`, `.flatMap`, `undefined`, `??`, `===`, `as unknown`, `Set`, `any`, `new`.
- Full `tsc --noEmit --pretty false --skipLibCheck` remains environment-blocked by missing type definitions:
  - `node`
  - `vitest/globals`
- No files were deleted.

## Architectural result

The active path is further normalized toward:

`source evidence -> lexical relations -> AST facts -> semantic rules -> relation solver -> fixed point -> semantic witness -> target lowering -> projection`

rather than embedding semantic authority in host-language control flow.
