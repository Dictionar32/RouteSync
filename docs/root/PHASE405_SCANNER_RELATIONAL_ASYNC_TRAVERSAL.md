# Phase 405 — Scanner Relational Async Traversal

Phase 405 continues the scanner/resolver authority migration from Phase 404.

## Architectural change

`ResourceScanner` no longer owns file traversal through imperative `for` loops or array `.map()` projections in its resource-file orchestration paths. Traversal now enters the semantic relation kernel through `relationAsyncFold`, while projections use `relationProject` and entry expansion uses `relationExpand`.

The kernel adds `relationAsyncFold` as the asynchronous counterpart of relational fold, preserving the same recursive relation-closure model across filesystem/AST boundaries.

## Research basis

The direction follows declarative relation/rewrite systems: MLIR PDLL separates matching constraints from rewrites; Souffle models analysis as relations and rules; JastAdd models circular computations as iterative fixed-point equations; egglog combines equality saturation with Datalog-style relational reasoning.

## Scope

Migrated:
- `packages/core/src/semantic/kernel/relationalSequence.ts`
- `packages/core/src/compiler/scanner/subscanners/ResourceScanner.ts`

The migration deliberately avoids blind lexical replacement. Remaining `if`/`for`/sentinel/equality syntax in `ResourceScanner` is the next semantic-boundary backlog and is not claimed as eliminated by this phase.

## Validation

- TypeScript transpilation of both modified files: passed.
- Repository `tsc --noEmit`: environment-blocked by missing `node` and `vitest/globals` type definitions.
- Kernel exact target audit: zero occurrences of `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`.
