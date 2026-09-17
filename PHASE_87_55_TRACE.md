# RouteSync Phase 87.55 — Semantic Resolution Single Source

## Trace
Laravel AST -> verified semantic domain -> SemanticResolution ADT -> Bound AST -> IR.

## Fixed
- Removed the legacy `LegacySemanticResolution` contract from the active source.
- Made `types/contract.ts` a compatibility re-export of the single domain SemanticResolution ADT.
- Migrated active semantic resolvers away from `types/contract`.
- Removed the legacy semantic-resolution adapter that converted ADT values back into porous objects.
- Reworked property target resolution around `SemanticResolution.kind === 'model'`.
- Reworked conditional, ternary, and special property resolution to emit the closed semantic ADT.
- Changed framework method rule cardinality from boolean flags to `ResolutionCardinality`.
- Added a compile-time invariant test for the closed SemanticResolution family.

## Boundary rule
Primitive JavaScript values remain valid where they are actual syntax/runtime values. They are not used as unqualified semantic state. Semantic identity and state use domain value objects and closed ADTs.

## Validation
- No active `LegacySemanticResolution` symbol remains under `packages/core/src`.
- No active semantic resolver imports `types/contract`.
- Modified resolver files pass targeted TypeScript checking.
- The repository still contains unrelated baseline TypeScript errors outside this phase; this phase does not claim a full-repository clean build.
