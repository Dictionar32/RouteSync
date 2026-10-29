# Phase 2785 — Semantic Mapping Runtime Operation Trace

## Scope

The phase converts the exported semantic mapping helpers into a typed, frozen runtime operation object. It does not alter mapper semantics, introduce a new reasoning primitive, or repopulate `collections.ts`.

## Runtime trace

```text
Upstream source discovery / AST scan
  → Laravel source AST projection judgment (complete | blocked)
  → complete source model builder (complete | blocked)
  → request-type artifacts
  → semanticMappingContractDerivation.derive(requestTypes)
      ├─ semanticMappingRuntimeOperations.readMapperFromResource(...)
      └─ semanticMappingRuntimeOperations.writeMapperFromAction(...)
  → SemanticMappingContract (closed upstream projection)
  → request-types lowering / mapper projection
  → CLI SDK generation
```

The source AST and source model gates remain separate from mapper projection. This phase only changes how the two mapper-contract projection operations are exposed and called.

## Public operation contract

`SemanticMappingRuntimeOperationsInterface` declares the complete input and output types for both operations. `semanticMappingRuntimeOperations` is an `Object.freeze`d object assigned to that interface. The implementation functions are private arrow constants and are not exported as standalone functions.

```ts
export const semanticMappingRuntimeOperations:
  SemanticMappingRuntimeOperationsInterface = Object.freeze({
    readMapperFromResource: semanticReadMapperFromResourceImpl,
    writeMapperFromAction: semanticWriteMapperFromActionImpl,
  });
```

The derivation layer calls the operations through the object and derives accumulator element types from `ReturnType<typeof semanticMappingRuntimeOperations...>`, so the public signatures remain the type source of truth.

## Semantic and ADT boundaries

- Existing `SemanticMappingContract` and `SemanticMappingEvidence` are unchanged.
- Existing `generic`/`aggregate_collection` and complete/blocked ADTs elsewhere in the runtime are not collapsed by this change.
- The existing `SemanticReasoningContract` member of the mapper domain remains part of its pre-existing contract; this phase adds no reasoning primitive.
- `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes), as required. No `Sequence`, `readonly T[]` substitution, or generic collection wrapper is introduced.

## Verification boundary

The Phase 2785 audit is structural. It verifies the interface-first operation shape, private implementations, updated call sites, barrel export, empty collections file, and the upstream manifest gate. It does not establish a full TypeScript project typecheck, full build, test-suite success, or CLI end-to-end correctness.
