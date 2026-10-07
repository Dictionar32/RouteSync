# Phase 1144 — Semantic Dataflow ADT Authority Closure

## Trace

```text
Laravel source
  -> scanner evidence
  -> CompleteLaravelSourceModel / ControllerActionFlowContract
  -> SemanticDataflowInputProducerInterface
  -> SemanticDataflowInput
  -> createSemanticDataflowJudgment
  -> DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>
  -> analysis / IR
```

Structural graph remains a separate lane:

```text
CompleteLaravelSourceModel.relations
  -> structural semantic relation
  -> GraphEdgeRelation / ServiceGraph
```

## Repair

`semanticDataflow.ts` is now the single upstream owner of the semantic dataflow
ADT. The previous `semanticDataflowInterface.ts` duplicated identity, fact,
input, and judgment definitions. It is now only a compatibility re-export
facade. `astDataflowInterface.ts` also points directly at the canonical ADT.

This removes two source locations for the same semantic meaning. TypeScript's
structural typing can make duplicated definitions assignable, but that does not
make duplicate semantic authorities desirable.

## DataFlowInterface boundary

`DataFlowInterface<Input, State, Node>` remains in `types/dataflow`. It is not
Laravel-specific and is not moved into `types/upstream`. Upstream owns semantic
meaning; downstream owns generic execution/state/query projection.

## Ecommerce path

`examples/ecommerce-shop-source` remains source/evidence material. Its routes,
controllers, requests, resources, models, migrations, and schemas are raised
into the upstream Laravel semantic model. The example source is not a second
RouteSync semantic authority.

## No graph/dataflow merge

Graph construction consumes structural relations from the manifest flow. IR
consumes the closed generic `DataFlowInterface` state. Neither consumer
reconstructs semantic closure.

## Research alignment

TypeScript's discriminated-union model supports a single discriminant-bearing
ADT as the semantic authority, allowing consumers to narrow without inventing
a second representation. MLIR's dataflow framework separates solver/fixpoint
mechanics from child analysis dependencies and transfer semantics. RouteSync
keeps that separation while putting Laravel semantic meaning upstream.
