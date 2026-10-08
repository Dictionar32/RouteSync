# Phase 1091 — Graph Service Surface Closure

## Purpose

Close the downstream graph service boundary so graph construction does not carry upstream service construction contracts or raw dependency facts.

## Boundary

```text
RouteSyncManifestFlow
        |
        v
RouteSyncManifestGraphSurface
        |
        v
GraphServiceSurface
        |
        +-- name
        +-- method names
        +-- resolved dependency targets
        |
        v
ServiceGraph
```

## Changes

- `GraphServiceSurface.methods` now contains only `GraphServiceMethodSurface { name }`.
- Raw `ServiceDependencyFacts` are no longer forwarded into the graph surface.
- `ResolvedServiceDependencies` are projected to `Sequence<DependencyTargetReference>` before crossing the downstream graph boundary.
- `ServiceNode` no longer stores upstream `ServiceMethod`, `ServiceDependencyFacts`, or `ResolvedServiceDependencies` payloads.
- Graph edge construction remains responsible for materializing `ServiceDependency` from the already-resolved dependency targets.
- `DataFlowInterface` remains unchanged and domain-neutral.
- `InterfaceDependencyBoundary<Upstream, Downstream>` remains directional: upstream value -> downstream wiring -> downstream contract.
- Canonical `SemanticRelationGraph` remains the structural relation authority.

## Evidence classification

- Controller/request expressions remain data-flow evidence where value-preserving.
- Model relations and migration foreign keys remain structural relation evidence.
- Loaded Eloquent relationships can contribute to resource/serialization projection, but are not automatically data-flow edges.

## External references

- Laravel 13 Eloquent serialization documents recursive serialization of loaded relationships.
- CodeQL documents a data-flow graph as a semantic value-flow representation distinct from the AST.
- MLIR documents interfaces as generic contracts that decouple analyses/transformations from concrete representations.
