# Phase 1211 — Upstream → Downstream Interface Algebra Strengthening

The semantic boundary is now expressed as a composition algebra rather than a collection of unrelated interfaces.

## Canonical direction

`Laravel source evidence -> upstream semantic authority -> closed capability/dataflow authority -> downstream projection -> manifest/graph/IR`

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned. `InterfaceComposition<Upstream, Intermediate, Downstream>` makes a two-stage projection explicit without importing downstream knowledge into upstream.

## Semantic capability

`SemanticCapabilityContract` is a closed algebra of identity, evidence, derivation, provenance, authority, kind, and closure. Downstream receives the contract; it does not classify the source again.

## Data-flow

`DataFlowInterface` is decomposed into execution algebra (`seed`, `derive`, `close`) and authority algebra (`input`, `state`, `reaches`, `closed`, `authority`). Downstream projections consume the authority algebra, not the execution surface.

This matches the compiler literature: data-flow graphs represent semantic value propagation rather than syntax, and fixed-point analyses are built from monotone transfer/join operations. MLIR likewise separates generic interfaces from dialect-specific implementation and models data-flow through lattice/fixpoint machinery.

## Remaining migration frontier

The static trace still identifies two scanner-local semantic resolvers that should be treated as future upstream-authority candidates:

- `RouteDomainResolver` — ranked route-domain semantic resolution.
- `ResourceModelResolver` — resource/model semantic binding resolution.

They must be migrated only after their complete evidence contract is identified upstream; replacing them with another downstream classifier would violate the dependency direction.
