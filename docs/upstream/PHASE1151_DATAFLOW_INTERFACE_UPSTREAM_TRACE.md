# Phase 1151 — DataFlow Interface / Upstream Trace

## Canonical boundary

```text
Laravel source
  -> CompleteLaravelSourceModel
  -> SemanticDataflowInputProducerInterface
  -> SemanticDataflowInput
  -> semanticDataflowAuthority
  -> SemanticDataflowJudgment
  -> DataFlowInterface<Input, State, Node>
  -> analysis / IR
```

The generic `DataFlowInterface` remains downstream-owned and domain-neutral.
The semantic meaning, evidence, identity, facts, and closure remain upstream-owned.

## Interface strengthening

`DataFlowExecutionInterface` is now an explicit interface extending the source,
step, and fixpoint capability interfaces instead of an intersection type alias.
This keeps the data-flow contract type-first and leaves concrete functions/objects
as wiring implementations.

## Structural lane

```text
Laravel route/controller/model/relation/resource/schema
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> ServiceGraph
```

Graph construction must not be reclassified as data-flow analysis.

## Manifest

`upstreamManifestBuilder.ts` is the canonical manifest construction path and
projects `semanticDataflowInputsFromSourceModel(...)` into the manifest surface.
The checked-in ecommerce JSON snapshot may be stale and must not become a second
semantic authority merely because its `dataflowInputs` are empty.

## TypeScript 6 / ES2025

The active root and ecommerce frontend configs use TypeScript 6.0.3 with
`target: ES2025`, `lib: ES2025` (plus DOM where required), `module: ESNext`,
`moduleResolution: Bundler`, and `strict: true`.
Historical phase tsconfigs are retained as historical artifacts and are not the
active compiler contract.
