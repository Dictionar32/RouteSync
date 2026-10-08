# Phase 1232 — Route Capability Upstream → Wiring → Downstream

## Trace

```text
Laravel route/controller/model/request evidence
        ↓
RouteCapabilityAuthority
        ↓
RouteCapabilityContract
        ↓
RouteSemanticFlow
        ↓
RouteCapabilityProjectionInterface
        ↓
UpstreamWiringInterface<RouteSemanticFlow, ClassifiedRoute>
        ↓
CLI grouping/type/naming generators
```

## Boundary rule

`RouteCapabilityContract` and `RouteSemanticFlow.capability` are semantic authority.
CLI projection may rename, group, format, and materialize these values, but may not
reconstruct CRUD meaning from HTTP method/path/model/schema.

`RouteCapabilityProjectionInterface` is a downstream-owned wiring contract. It
specializes the existing `UpstreamWiringInterface`; it does not introduce another
semantic authority.

## Dataflow relationship

```text
SemanticDataflowAlgebra
        ↓
SemanticDataflowContract
        ↓
SemanticDataflowInterface
        ↓
DataFlowCapabilityAuthority / DataFlowProjection
        ↓
IR / downstream consumers
```

Generic `DataFlowInterface` remains execution/state/query infrastructure. Semantic
meaning remains owned by the closed upstream semantic dataflow contract.

## External architectural correspondence

- MLIR interfaces decouple analyses/transformations from concrete IR operations and
  support interface inheritance.
- CodeQL distinguishes AST nodes from data-flow nodes and uses solver/closure
  machinery for global flow.
- Laravel exposes route methods, parameters, controller actions, and model binding
  as framework-level route semantics; these are upstream evidence for RouteSync.
- TypeScript 7 preserves the compiler's logical structure while moving implementation
  to a native codebase, reinforcing separation of semantic structure from execution.
