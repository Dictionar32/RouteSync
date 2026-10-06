# Phase 1057 — Upstream → wiring → interface → downstream boundary

## Canonical trace

```text
examples/ecommerce-shop-source (Laravel)
  Route / Controller / Request / ModelRelation / Resource / Schema
        |
        v
  scanner/upstream + semantic upstream contracts
        |
        v
  RouteSyncManifestFlow
        |
        +--> structural/provenance lane
        |      StructuralSemanticRelation
        |        -> GraphEdgeRelation
        |          -> GraphEdgeRelationSink
        |            -> ServiceGraph
        |
        +--> dataflow seed lane
               SemanticDataflowInput
                 -> createSemanticDataflowJudgment()
                    [upstream authority: derive/closure/reaches]
                 -> semanticDataflowDataFlowAdapter.ts
                    [runtime wiring only]
                 -> DataFlowInterface<Input, State, Node>
                    -> analysis / policy / IR
```

## Contract ownership

- `types/dataflow/dataFlowInterface.ts` is the canonical generic dataflow execution/state/query contract.
- `types/interfaces/interfaceDependencyBoundary.ts` is a directional upstream-value → downstream-materialization boundary.
- `types/dataflow/dataFlowProjectionInterface.ts` specializes that boundary only when the upstream value is genuinely a `DataFlowInterface`.
- `types/upstream/semanticDataflowAuthority.ts` owns semantic closure and must not import downstream contracts.
- `compiler/analysis/semanticDataflowDataFlowAdapter.ts` is the sole runtime adapter from semantic authority to generic `DataFlowInterface`.
- `compiler/analysis/semanticDataflowRuntimeComposition.ts` owns composition/wiring.
- `compiler/ir/SemanticDataflowIRProjection.ts` consumes canonical dataflow state and does not solve closure.
- `graph/ServiceGraphBuilder.ts` uses `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>` because graph is structural/provenance materialization, not dataflow projection.

## Naming repair

`compiler/analysis/dataflow/dataFlowInterface.ts` was ambiguous with the canonical generic contract. It is now named `controlFlowDataFlowInterface.ts` because it contains only CFG forward/backward analysis capabilities.

This keeps:

```text
DataFlowInterface
  = semantic/generic dataflow execution contract

ControlFlowDataFlowInterface
  = CFG-specific analysis contract
```

as separate concepts and files.
