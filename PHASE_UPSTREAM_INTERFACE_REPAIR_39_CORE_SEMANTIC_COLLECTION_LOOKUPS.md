# Phase 39 — Core Semantic Collection Lookup Boundary

## Scope
Whole `packages/core/src`, excluding legacy `packages/core/src/compiler.ts`.

## Trace
The audit found semantic collection classes exposing low-level lookup contracts such as:
- `get(...): T | undefined`
- paired `has(...)` calls
- generic string-keyed semantic maps

These contracts force consumers to reconstruct absence semantics and encourage `get → if` / `has → get` flows.

## Repair
Canonical `Lookup<T>` from `types/upstream/collections.ts` is now used at the semantic collection boundary.

Changed collections in `types/domain/semanticCollections.ts`:
- `ModelFieldMap.lookup()`
- `ModelRelationMap.lookup()`
- `ModelAccessorMap.lookup()`
- `ModelServiceMap.lookup()`
- `ModelControllerMap.lookup()`
- `ModelNodeMap.lookup()`
- `SemanticModelMap.lookup()`
- `SemanticRelationMap.lookup()`

The old `get(): T | undefined` + `has()` semantic API was removed from these collection interfaces.

`semantic/modelNodes.ts`:
- `ModelAssignmentIndex.lookupBinding()` now returns `Lookup<ModelAssignmentBinding>`.

## Intent
This is an interface-first migration. Consumers are deliberately not mass-rewritten in this phase. Resulting compile errors are migration signals showing which consumers still depend on the old low-level contract.

## Exclusion
`packages/core/src/compiler.ts` remains legacy and is excluded from the audit/refactor scope.

## Next trace target
Prioritize active-core semantic contracts still exposing `get(): T | undefined`, especially:
- `types/domain/queryProjectionResolution.ts`
- controller/action dataflow semantic indexes
- model symbol semantic indexes

Do not alter legitimate runtime/cache absence contracts merely because they use `undefined`.
