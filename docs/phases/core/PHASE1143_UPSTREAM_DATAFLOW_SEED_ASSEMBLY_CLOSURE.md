# Phase 1143 — Upstream Dataflow Seed Assembly Closure

## Boundary

The manifest dataflow surface is now transport-only:

`CompleteLaravelSourceModel -> SemanticDataflowSeedProducerInterface -> SemanticDataflowInput -> SemanticDataflowJudgment -> DataFlowInterface -> IR`

`semanticDataflowManifestSurface.ts` no longer assembles controller facts. It delegates seed construction to the upstream producer authority.

## Ownership

`types/upstream/semanticDataflowInputFactory.ts` owns:

- canonical `SemanticDataflowInput` construction;
- producer lineage attachment;
- controller-scoped seed enrichment from route parameters, controller semantics, controller queries, and request semantics;
- source-model seed sequencing.

The manifest surface only exposes the resulting `Sequence<SemanticDataflowInput>`.

## Dependency direction

`types/upstream` does not import the generic `types/dataflow/DataFlowInterface`.
The generic execution/state/fixpoint/query contract remains downstream and domain-neutral.

Graph remains on the structural relation lane and IR remains a projection of closed dataflow state.

## Result

- one upstream seed assembly authority;
- no duplicate manifest-side semantic assembly;
- no upstream -> scanner dependency;
- no upstream -> generic dataflow dependency;
- no `any` or assertion-based widening introduced by this phase;
- existing empty legacy placeholders remain untouched.
