# Phase 54 — Downstream Dumb Structured Lookup

## Scope
Whole `packages/core/src` active tree. `packages/core/src/compiler.ts` remains legacy and excluded.

## Trace root
Structured semantic property access still had lower lookup boundaries:
- `QueryProjectionFieldIndex.get()` returned `T | undefined`.
- `ObjectSemanticResolution` exposed only a raw `fields[]`, forcing consumers to search with `.find()`.
- property-access consumer mixed query-projection lookup and raw object-field search.

## Repair
Raised structured semantic lookup interfaces:
- `QueryProjectionFieldIndex.lookupField()` returns canonical `Lookup<QueryProjectionField>`.
- Added `SemanticObjectFieldIndex.lookupField()` returning `Lookup<SemanticObjectField>`.
- `ObjectSemanticResolution` now carries `surface.byName` backed by `SemanticObjectFieldIndex`.
- `SemanticResolutionFactory.object()` constructs the correlated object surface at the origin boundary.
- `property-access/index.ts` consumes typed lookup directly for both query projections and objects.
- `specialAccessHandler.ts` now uses `lookupField()` for query projection fields.

## Result
Downstream no longer performs raw `.find()`/`.get()` to discover structured field existence or semantic field data.
The lookup itself remains an explicit ADT boundary (`found | missing`), so JavaScript `Map.get()` implementation detail does not leak downstream.

## Verification
Narrow TypeScript compilation still has pre-existing migration errors in unrelated areas (`parameters.ts`, `zodAstTypes.ts`, missing Node `crypto` types). No new diagnostic was observed in the modified structured lookup files.

## Next trace
Continue across active `core/src` for semantic re-classification patterns, especially `SymbolTable.findFirst`, response/resource field lookup, method-return resolution, and remaining domain collections. Do not repair by casts/fallbacks.
