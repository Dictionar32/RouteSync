# Phase 1070 — DataFlow upstream/wiring closure

This phase closes the remaining naming and compatibility ambiguity around the generic `DataFlowInterface` and legacy `StaticLaravelScanner`.

## Boundary

`DataFlowInterface<Input, State, Node>` is a generic execution/state/query contract. The semantic data-flow authority owns domain closure; the generic interface does not encode Laravel route/controller/model/resource/schema policy.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned. A downstream wiring or projection interface consumes an upstream value and materializes its own contract.

`DataFlowProjectionInterface` is only the specialization where the upstream value is itself a `DataFlowInterface`. Graph therefore uses the generic dependency boundary, while IR uses the data-flow projection boundary.

## Legacy scanner

`StaticLaravelScanner` remains a compatibility facade. It consumes `ManifestBuilderInterface`; it does not own manifest construction or source-project identity. `createLaravelSourceProjectIdentity` remains an upstream implementation and is only re-exported by the legacy facade.

The scanner accepts an optional `ManifestBuilderInterface` through its compatibility `create` path, allowing tests/wiring to depend on the producer contract instead of a concrete producer implementation. The default remains the canonical `manifestBuilder` for backward compatibility.

## Fixture semantics

The ecommerce fixture keeps route/controller/request/resource value-flow evidence distinct from Eloquent relation and migration schema/provenance evidence. Relations may participate in serialization/projection when explicitly loaded, but they are not automatically promoted to value-flow edges.

## Result

The audit asserts the upstream lane has no downstream boundary imports, graph and IR select the correct boundary specialization, and the legacy scanner consumes the canonical producer interface.
