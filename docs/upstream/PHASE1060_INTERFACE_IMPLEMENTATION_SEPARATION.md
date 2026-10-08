# Phase 1060 — Interface / implementation separation

## Boundary decision

The upstream -> wiring -> interface -> downstream architecture was already semantically closed in Phase 1059. Phase 1060 tightens the public contract surface without changing semantic ownership.

### Graph

`ServiceGraphBuilderInterface` now lives in:

`packages/core/src/graph/ServiceGraphBuilderInterface.ts`

The concrete `ServiceGraphBuilder` remains in `ServiceGraphBuilder.ts` and is not exported from the core root. The public factory returns the interface.

### IR

`SemanticDataflowIRProjectionInterface` now lives in:

`packages/core/src/compiler/ir/SemanticDataflowIRProjectionInterface.ts`

The reusable IR value types live in:

`SemanticDataflowIRProjectionTypes.ts`

The concrete `SemanticDataflowIRProjection.ts` imports the interface and value types; the interface does not import the concrete implementation.

## Canonical direction

```text
Laravel route/controller/request/resource
model relation/schema evidence
        |
        v
upstream semantic contracts
        |
        v
RouteSyncManifestFlow / SemanticDataflowInput
        |
        v
semanticDataflowAuthority
        |   semantic closure / reachability
        v
semanticDataflowDataFlowAdapter
        |   runtime wiring
        v
DataFlowInterface<Input, State, Node>
        |
        +--> IR projection interface --> concrete IR
        |
        +--> analysis/query consumers

RouteSyncManifestFlow
        |
        +--> InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>
                    |
                    v
              concrete graph builder
```

## Invariants

- `DataFlowInterface` remains domain-neutral execution/state/query contract.
- `InterfaceDependencyBoundary` remains downstream-owned and directional.
- `DataFlowProjectionInterface` is used only where the upstream value is genuinely a `DataFlowInterface`.
- Semantic closure remains owned by `semanticDataflowAuthority`.
- Runtime adapter remains the only generic DataFlow wiring point.
- Manifest remains seed-only.
- Graph remains structural/provenance and does not become a DataFlow projection.
- Model relations and schema foreign keys are not promoted to value-flow without explicit semantic evidence.
- Public consumers depend on interfaces/types, not concrete Graph/IR implementation modules.

## External design alignment

MLIR uses generic interfaces so transformations and analyses can operate without encoding concrete dialect knowledge. LLVM's new pass manager separates analysis computation/results from pass consumers. CodeQL separates a generic dataflow solver from source/sink/barrier configuration. Laravel contracts similarly separate interface contracts from implementations.

These patterns support keeping RouteSync's generic `DataFlowInterface` small, with domain-specific evidence and policy remaining outside the generic contract.
