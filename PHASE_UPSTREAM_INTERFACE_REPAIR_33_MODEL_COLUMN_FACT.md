# Phase 33 — Model Column Fact

## Scope
Interface upstream only. Downstream implementation intentionally not repaired.

## Trace root
Model column semantics were split between `ColumnDefinition` and a separate `ModelCasts` collection. Consumers could therefore look up a cast by column name and re-classify the effective semantic type.

## Repair
Canonicalized the existing model source fact instead of creating a second vocabulary:
- existing `ModelColumnFact` remains the SSOT
- `ModelColumnType` now correlates the effective semantic type with its origin (`native` or `casted`) so a consumer cannot combine an arbitrary type with an unrelated cast
- `ModelColumnFacts` collection now points to that canonical `modelSourceFacts.ModelColumnFact`
- `ModelSchema.columns` now uses the correlated fact collection

The cast relationship is now part of the column fact itself.

## Target flow
`ModelScanner -> ModelColumnFact -> ModelSchema -> Manifest`

Consumer must not need to perform `find/get` over a separate cast collection to determine the column's cast semantics.

## Verification
Upstream scan contains no runtime `null`, `undefined`, `any`, `Record<>`, `??`, or `?.` tokens.

## Intentional consequence
Existing consumers expecting `Columns` or independent `ModelCasts` may fail compilation. These are migration signals; the upstream contract is not weakened to satisfy them.

## Second repair in this root
The old shape allowed `type` and `cast` to be independently populated. That could represent contradictory states. The interface now makes the relationship explicit through `ModelColumnType`.

## Verification after trace refinement
- Canonical `ModelColumnFact` exists only in `modelSourceFacts.ts`.
- `ModelColumnType` correlates effective type with native/casted origin.
- No runtime `null`, `undefined`, `any`, `Record<>`, `??`, or `?.` in `types/upstream`.
- Existing scanner/consumer errors are intentionally left for the later implementation migration pass.
