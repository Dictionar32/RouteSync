# Phase 1064 — Upstream → Wiring → Downstream assembly boundary

Phase 1063 traced the canonical semantic dataflow boundary and found one remaining
concrete graph implementation consumer in the CLI model normalizer. That consumer
was an incremental structural graph assembly path, not a manifest projection path.

## Boundary decision

The graph layer now exposes two distinct downstream surfaces:

```text
RouteSyncManifestFlow
        ↓
InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>
        ↓
ServiceGraphBuilderInterface.project()
        ↓
ServiceGraph
```

and, for incremental model graph assembly:

```text
ModelSemanticDefinition
        ↓
ServiceGraphAssemblyInterface
        ↓
concrete graph assembly
        ↓
ServiceGraph
```

The second surface is intentionally not `DataFlowProjectionInterface`: model
relations and schema-derived graph edges are structural/provenance materialization,
not semantic value-flow closure.

## DataFlowInterface remains unchanged

`DataFlowInterface<Input, State, Node>` remains the generic execution/state/query
contract. It owns seed, current state, derive, close, and reaches. Laravel-specific
source/sink/barrier policy remains in downstream analysis policy rather than being
added to this generic interface.

## Upstream direction

No file under `types/upstream` imports:

- `DataFlowInterface`
- `InterfaceDependencyBoundary`
- `DataFlowProjectionInterface`
- runtime boundary types
- concrete graph builder types
- concrete IR projection types

The dependency remains downstream-owned:

```text
upstream semantic evidence
        ↓
SemanticDataflowInput
        ↓
semanticDataflowRuntimeBoundary
        ↓
DataFlowInterface
        ↓
analysis / IR / query
```

## Ecommerce evidence classification

The ecommerce fixture preserves the following distinction:

- route declarations → route evidence;
- controller/request/resource expressions → semantic value-flow evidence;
- Eloquent model relations → structural/provenance evidence;
- migration foreign keys/schema → structural database evidence;
- graph → structural/provenance projection;
- IR → closed semantic dataflow projection.

A model relation or schema foreign key therefore does not become a data-flow edge
unless an explicit semantic value-flow rule supplies that evidence.
