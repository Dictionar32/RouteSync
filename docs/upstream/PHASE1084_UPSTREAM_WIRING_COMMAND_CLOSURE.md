# Phase 1084 — Upstream → Wiring → Command Closure

This phase audits the complete command-facing boundary after the manifest-flow split.

## Boundary

```text
RouteSyncManifest (construction, AST)
        |
        v
RouteSyncManifestFlowProjectionInterface
  InterfaceDependencyBoundary<RouteSyncManifest, RouteSyncManifestFlow>
        |
        v
RouteSyncManifestFlow (AST-free semantic handoff)
        |
        +--> ServiceGraphBuilderInterface
        |      InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>
        |
        +--> SemanticDataflowRuntimeBoundary
        |      InterfaceDependencyBoundary<SemanticDataflowInput, DataFlowInterface<...>>
        |
        +--> SemanticDataflowIRProjectionInterface
               DataFlowProjectionInterface<...>
```

## Command ownership

- `scan` and `sync` build `RouteSyncManifest` once, project it to `RouteSyncManifestFlow`, and pass the flow to downstream graph/dataflow consumers.
- `routeManifestLowerer` remains construction-side because it intentionally reads `manifest.ast`.
- `driftAuditor` remains construction-side because drift comparison needs the concrete manifest artifact; it does not become a semantic-flow consumer merely because it calls `manifestBuilder`.
- No CLI command references `StaticLaravelScanner`.

## Domain separation

- route/controller/request value evidence -> semantic data-flow inputs
- model relations -> structural relation evidence
- resources -> response projection evidence
- schema/FK -> structural/provenance evidence

A model relation or foreign key is not promoted to a data-flow edge without explicit value-flow evidence.

## External alignment

CodeQL separates its generic data-flow graph/solver from analysis configuration such as sources, sinks, barriers, and additional flow steps. MLIR similarly uses generic interfaces so analyses and transformations do not encode concrete operation/dialect knowledge. These patterns support keeping RouteSync's `DataFlowInterface` domain-neutral and putting Laravel-specific policy at the semantic producer/configuration boundary.
