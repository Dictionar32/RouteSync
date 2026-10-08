# Phase 443 — Scanner Query Aggregate Relational Cutover

## Objective
Move the remaining query-aggregate scanner authority from imperative Map/undefined/slice-style lookup into declarative relation catalogs and `RelationOption`/relational folds.

## Research basis
- MLIR PDLL models matching/constraints separately from rewrites.
- MLIR DRR models source patterns, result patterns, and additional constraints declaratively.
- egglog combines equality saturation with Datalog-style relational reasoning.
- JastAdd circular attributes use iterative fixed-point evaluation over convergent domains.

## Changes
- `relationAggregateCatalog`: `ReadonlyMap` -> immutable relation tuple catalog.
- `relationAggregateFunction`: returns `RelationOption` directly through `relationLookup`.
- `relationAggregate`: returns `RelationOption<QueryRelationAggregate>` and performs function/path/column/alias resolution relationally.
- aggregate named-method resolver now folds the aggregate option instead of checking an absent sentinel.
- validated query-column sequence resolution now returns `RelationOption`.
- removed the duplicate `QueryNamedMethodResolver` declaration left by earlier partial cutover.
- replaced aggregate string slicing with `relationTextSlice`.

## Validation
- TypeScript `transpileModule`: 0 diagnostics for the modified file.
- Full `tsc --noEmit -p tsconfig.json` remains environment-blocked because `@types/node` and `vitest/globals` are unavailable.
- Exact target lexical audit is recorded below; this phase does **not** claim whole-file eradication.

## Exact target audit — queryEvidenceProducer.ts
- `if`: 1
- `for`: 1
- `while`: 0
- `switch`: 0
- `.map(`: 0
- `.filter(`: 0
- `.reduce(`: 0
- `.flatMap(`: 0
- `undefined`: 355
- `??`: 0
- `null`: 1
- `===`: 1
- `as unknown`: 0
- `||`: 0
- `.trim(`: 0
- `&&`: 0
- `index + N`: 0
- `.slice(`: 2

The remaining `undefined`/control-flow/slice/equality occurrences are outside the migrated aggregate and validated-column regions and remain explicit follow-up targets.
