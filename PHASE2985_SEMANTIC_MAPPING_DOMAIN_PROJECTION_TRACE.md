# Phase 2985 — Semantic Mapping Domain Projection Trace

## Change

`packages/core/src/types/upstream/semanticMapping.ts` no longer imports `relationProject` from the removed `semantic/relations/relationalSequence` foundation. Mapping projection is now owned by a private `SemanticMappingProjectionOperationsInterface` and `semanticMappingProjectionOperations` object. Nested object fields, read-mapper fields, and write-mapper fields all use this domain-local operation.

The public runtime boundary remains:

```ts
export const semanticMappingRuntimeOperations: SemanticMappingRuntimeOperationsInterface = Object.freeze({
  readMapperFromResource: semanticReadMapperFromResourceImpl,
  writeMapperFromAction: semanticWriteMapperFromActionImpl,
});
```

Consumers should call `semanticMappingRuntimeOperations.readMapperFromResource(...)` and `.writeMapperFromAction(...)`; the implementation functions remain private.

## Runtime trace (verified source references)

```text
PHP / Laravel source
  ↓
source reader + scanner / route and controller evidence
  ↓
upstream SemanticType + PropertyName / ResourceName / FormTypeName
  ↓
semanticMappingRuntimeOperations
  ├─ readMapperFromResource(...)
  │    └─ semanticMappingProjectionOperations.project(...)
  └─ writeMapperFromAction(...)
       └─ semanticMappingProjectionOperations.project(...)
  ↓
semantic mapping contracts
  ↓
packages/core/src/compiler/semantic/request-type-derivation/semanticMappingContractDerivation.ts
  ↓
request-type / manifest / IR compilation consumers
```

The source confirms the derivation consumer calls the typed runtime operations. This phase removes one direct import of the deleted relation foundation; it does **not** establish that every scanner → CLI → manifest → IR boundary is migrated. The derivation consumer still uses a `relationFold` dependency and remains an explicit next audit target.

## Design decision

This is a mapping-domain operation, not a replacement generic relation foundation. No generic `collections.ts` implementation was added, and the deleted relation modules were not recreated. The `map` here expresses field projection after the semantic types have already been resolved; it does not make domain decisions based on primitive tags.

## Audit and verification

Run `npm run audit:phase2985-semantic-mapping-domain-projection` for the structural audit. Syntax is separately checked with the installed TypeScript transpiler. Full workspace typecheck, build, and all tests are not claimed by this phase.

## Next steps

1. Trace and migrate `relationFold` in `semanticMappingContractDerivation.ts` through an existing domain owner; do not restore a generic relation foundation.
2. Trace CLI scan output through manifest creation and IR serialization, recording exact callsites and evidence-preservation rules.
3. Continue auditing exported runtime functions and arrows on the actual runtime path; migrate only where a named domain interface can own the operation.
4. Run full build and tests after the known unresolved-import/dependency blockers are reconciled.
