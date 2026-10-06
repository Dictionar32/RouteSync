# Phase 1061 — Upstream → Wiring Interface → Downstream

Phase 1061 tightens the dependency direction established by the earlier dataflow boundary phases.

## Canonical direction

```text
Laravel route/controller/request/model_relation/resource/schema
    ↓
upstream semantic evidence
    ↓
SemanticDataflowInput
    ↓
semanticDataflowAuthority
    ↓
SemanticDataflowJudgment
    ↓
InterfaceDependencyBoundary<SemanticDataflowInput, DataFlowInterface<...>>
    ↓
semanticDataflowDataFlowAdapter
    ↓
DataFlowInterface
    ├── analysis/query
    └── DataFlowProjectionInterface → IR
```

The wiring interface is downstream-owned. `types/upstream` does not import or implement
`InterfaceDependencyBoundary`, `DataFlowProjectionInterface`, or
`SemanticDataflowRuntimeBoundary`.

## Contract roles

- `DataFlowInterface<Input, State, Node>` remains generic and domain-neutral.
- `InterfaceDependencyBoundary<Upstream, Downstream>` defines the directional projection boundary.
- `SemanticDataflowRuntimeBoundary` specializes that boundary for `SemanticDataflowInput → DataFlowInterface<...>`.
- `semanticDataflowDataFlowAdapter.ts` is the concrete wiring implementation.
- `semanticDataflowAuthority.ts` remains the semantic closure authority and does not know about downstream wiring.
- `DataFlowProjectionInterface` remains a narrower specialization for consumers whose upstream is already a `DataFlowInterface`.
- Graph continues to use its own structural `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>` lane.

## Ecommerce evidence

The ecommerce fixture is checked end-to-end for route evidence, controller request/resource evidence,
resource value projection, model relationship evidence, and schema foreign-key evidence. Model relationships
and schema foreign keys remain structural/provenance unless explicit value-flow evidence exists.

## Validation

Phase 1061 audit checks the generic contract, directional boundary, downstream wiring specialization,
adapter ownership, upstream isolation, pipeline consumers, IR projection, graph separation, manifest seed-only
semantics, and the ecommerce fixture. Regression audits through Phase 1061 must remain passing.
