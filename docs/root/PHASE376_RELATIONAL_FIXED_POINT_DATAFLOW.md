# Phase 376 — Relational Fixed-Point Dataflow Authority

Phase 376 continues the semantic authority migration from imperative worklists to declarative relation rounds and fixed-point convergence.

## Research basis

- MLIR PDLL/DRR separates declarative matching from rewrite construction.
- Soufflé models computation as relations and Horn rules rather than imperative traversal.
- K defines executable semantics through configurations and rewrite rules.

## Changes

1. `compiler/analysis/dataflow/forwardSolver.ts`
   - removed imperative `for` initialization and `while` worklist
   - removed collection `.map()` / `.filter()` traversal
   - removed non-null / `undefined` sentinels
   - each round derives a complete state relation
   - convergence is determined by relational equality

2. `compiler/analysis/dataflow/backwardSolver.ts`
   - same fixed-point relational model, reversed dependency direction

3. `semantic/modelNodes.ts`
   - `ModelAssignmentIndex` is now an immutable relation-backed sequence
   - no `for` population loop
   - no `Map.get()` / `undefined` absence sentinel
   - lookup returns the canonical `Lookup` relation

4. `semantic/plugins/ConditionalWrapperResolver.ts`
   - dispatch moved to relation refinement/folding
   - symbol/relation absence uses `Lookup`
   - strict equality and imperative branches removed

5. `semantic/plugins/AccessorResolver.ts`
   - resolver dispatch moved to relation refinement and `Lookup`
   - accessor computation is a tagged semantic relation
   - cycle handling remains an explicit semantic gate

6. `semantic/plugins/expression/literalHandler.ts`
   - removed TypeScript `unknown` from literal ingress
   - literal input derives directly from the resolver metadata vocabulary

## Boundary audit

AST audit covers semantic, scanner, and dataflow production TypeScript excluding test directories.

Phase 376 totals remain non-zero globally because legacy reservoirs are still present outside the migrated authority boundary.

Migrated Phase 376 files have zero AST occurrences of:

- `if`
- `for`
- `while`
- `switch`
- `.map()`
- `.filter()`
- `.reduce()`
- `.flatMap()`
- `undefined`
- `null` syntax sentinel
- `===`
- `!==`
- TypeScript `as`
- TypeScript `unknown`

Full repository type-check is still blocked by the checkpoint environment lacking `@types/node` and `vitest/globals`.
