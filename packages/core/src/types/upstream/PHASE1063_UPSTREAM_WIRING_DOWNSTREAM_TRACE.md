# Phase 1063 — Upstream → Wiring → Downstream trace

Phase 1063 traces the canonical dependency direction across upstream semantic contracts, runtime wiring, manifest, graph, IR, and the ecommerce Laravel fixture.

## Boundary rule

- `DataFlowInterface<Input, State, Node>` is generic execution/state/query vocabulary only.
- `InterfaceDependencyBoundary<Upstream, Downstream>` is downstream-owned: downstream wiring/projection consumes an upstream value and materializes its downstream contract.
- Semantic upstream contracts must not import or implement downstream wiring/projection contracts.
- `SemanticDataflowRuntimeBoundary` is the concrete downstream-owned specialization from `SemanticDataflowInput` to the generic `DataFlowInterface`.
- `semanticDataflowAuthority` remains the semantic closure authority; `semanticDataflowDataFlowAdapter` is runtime wiring only.
- Manifest remains seed/materialization input and does not acquire closure semantics.
- Graph consumes `RouteSyncManifestFlow` through `ServiceGraphBuilderInterface` and its generic `project` boundary; graph remains structural/provenance.
- IR consumes the closed `DataFlowInterface` through `DataFlowProjectionInterface`; it does not compute closure.

## Concrete repair

The CLI previously instantiated the concrete `ServiceGraphBuilder`. It now consumes the public downstream boundary through `createServiceGraphBuilder().project(manifestFlow)`. This keeps the public consumer on the interface/factory path and prevents concrete graph implementation leakage into the CLI.

## Ecommerce fixture classification

The fixture supplies independent evidence lanes:

- route declarations → route semantic input;
- controller/request/resource expressions → semantic/value-flow evidence;
- model relations and schema foreign keys → structural/provenance evidence unless explicit value-flow evidence exists;
- resources → response/value projection evidence.

These facts are lowered upstream and only then wired into generic downstream contracts.
