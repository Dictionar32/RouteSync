# Phase 824 — Route Wiring Cutover (Historical Checkpoint)

## Objective

Use the existing canonical route authorities instead of retaining a duplicate route factory implementation. No new semantic model or compatibility factory was introduced.

## Historical changes

- The legacy route factory implementation was detached from the production dependency graph.
- The route boundary SSOT path was rewired toward the existing canonical authorities.
- The canonical production path was preserved through `RouteBoundaryContractFactory`, `RouteProducerInput`, and `routeProducer.produce()`.

## Current filesystem clarification

Phase 825 intentionally restored the former route factory paths as **empty files** so the migration can preserve the tree until reachability is proven zero. Therefore this document's historical references to deletion do not describe the current filesystem state.

The current state is authoritative in `PHASE826_ROUTE_WIRING_TRACE.md`.

## Canonical path

`RouteDeclarationAst -> RouteEmission -> RouteBoundaryContractFactory.create() -> RouteBoundaryContract -> RouteProducerInput -> routeProducer.produce() -> RouteAst`
