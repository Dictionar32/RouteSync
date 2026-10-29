# Phase2982 — Fully Explicit Simplicity: Graph Domain Runtime Operations

## Intent

Continue the interface-first migration on the actual graph runtime path after Phase2981. Move node construction, edge creation, and semantic-relation projection behind named, explicitly typed runtime objects. Remove the graph compiler's runtime imports from the deleted generic `relationalSequence` foundation without recreating a generic relation library.

## Runtime trace

```text
PHP / Laravel source evidence
  └─ routes / controllers / resources / models
       ↓
Upstream semantic contracts and graph projection surface
  └─ semanticDataflowControllerProjectionAuthority.project(...)
     ├─ ControllerResourceModelJudgment.continueWith(...)
     └─ ControllerModelParameterJudgment.continueWith(...)
       ↓
CLI scan composition
  └─ serviceGraphBuilderFactory.createBuilder()
       ↓
ServiceGraphBuilder
  ├─ graphNodeFactoryOperations.detectExecutionLayer(...)
  ├─ graphNodeFactoryOperations.buildServiceNode(...)
  ├─ graphNodeFactoryOperations.buildControllerNode(...)
  └─ graphNodeFactoryOperations.buildModelNode(...)
       ↓
manifestGraphCompilationOperations.compile(surface, context)
  ├─ graph-private sequence traversal
  ├─ controllerRegistry.registerAction(...)
  ├─ structuralSemanticRelationProjectionOperations.project(...)
  └─ graphEdgeRelationOperations.create(...)
       ↓
serviceGraphAssemblyOperations.assemble(...)
       ↓
ServiceGraph → manifest / IR consumers
```

## Runtime contract example

```typescript
export interface GraphNodeFactoryOperationsInterface {
  readonly detectExecutionLayer: (filePath: string, sourceText: string) => ExecutionLayer;
  readonly buildServiceNode: (name: ServiceNodeName, methods: readonly ActionName[]) => ServiceNode;
  readonly buildControllerNode: (name: ControllerNodeName, actions: readonly ActionName[]) => ControllerNode;
  readonly buildModelNode: (model: GraphModelNodeSurface) => ServiceModelNode;
}

export const graphNodeFactoryOperations: GraphNodeFactoryOperationsInterface = Object.freeze({
  detectExecutionLayer: detectExecutionLayerValue,
  buildServiceNode: buildServiceNodeValue,
  buildControllerNode: buildControllerNodeValue,
  buildModelNode: buildModelNodeValue,
});
```

Consumers call `graphNodeFactoryOperations.buildServiceNode(...)` rather than importing an exported standalone factory function. The same contract style now governs graph-edge construction and structural semantic-relation projection. Projection returns the closed `StructuralGraphEdgeProjection` ADT (`projected` or `not_projectable`), which callers can act on without recreating the projection rule.

## Changes

- Replaced exported `detectExecutionLayer`, `buildServiceNode`, `buildControllerNode`, and `buildModelNode` functions with `graphNodeFactoryOperations: GraphNodeFactoryOperationsInterface`.
- Replaced `createGraphEdgeRelation(...)` with `graphEdgeRelationOperations.create(...)` and its explicit interface.
- Replaced `projectStructuralSemanticRelationToGraphEdge(...)` with `structuralSemanticRelationProjectionOperations.project(...)` and its explicit interface.
- Migrated `ServiceGraphBuilder`, `ControllerRegistry`, `manifestGraphCompiler`, service barrel exports, public Core exports, and the focused projection tests.
- Removed `relationalSequence` runtime helper imports from `manifestGraphCompiler`; sequence consumption is now a private graph compilation concern, not a restored generic relation foundation.
- Migrated `semanticDataflowControllerProjection.ts` off the deleted relation-sequence helpers, removed the exported standalone `semanticDataflowControllerFacts` function, and represented model-origin / model-parameter matches as continuation-bearing ADTs. The existing `semanticDataflowControllerProjectionAuthority` remains the upstream runtime entry point consumed by `semanticDataflowInputFactory`.
- Replaced the exported `createSemanticDataflowInputProducer(...)` factory arrow with the direct runtime object `semanticDataflowInputProducer: SemanticDataflowSeedProducerInterface = Object.freeze({...})`; its projection authorities are assembled once at the upstream composition boundary.
- Kept `packages/core/src/types/upstream/collections.ts` empty and did not restore any deleted relation foundation file.

## Laravel source alignment

Laravel's official routing and controller documentation models route declarations as mapping HTTP methods/URIs to controller actions and documents controller organization, resource actions, and dependency injection. RouteSync should preserve those as source-derived facts and semantic contracts, then project them through typed graph operations; it should not infer new facts from graph insertion order. See the official Laravel Routing and Controllers documentation referenced in the phase response.

## Remaining blockers

- Wider upstream / CLI / manifest / IR code still contains direct imports from deleted relation foundation modules; Phase2982 is not a whole-workspace migration. The controller dataflow projection is one migrated upstream slice, not full upstream closure.
- The public `Sequence` contract remains entangled with the intentionally empty `upstream/collections.ts` and other old imports, including the producer's type-level `Sequence` contract. Do not fill that file or create a renamed generic collection foundation. Identify the existing domain-specific owner and migrate its consumers there.
- Full build and full tests remain blocked by absent project dependencies and the unresolved imports documented in `/mnt/data/build.log`.
