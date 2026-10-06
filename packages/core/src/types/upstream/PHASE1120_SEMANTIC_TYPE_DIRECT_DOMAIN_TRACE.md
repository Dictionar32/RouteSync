# Phase 1120 — Upstream → Wiring → Interface → Downstream SemanticType Trace

## Scope

Trace:

- `core/src/types/upstream`
- CLI `src/commands`
- `examples/ecommerce-shop-source`
- legacy `StaticLaravelScanner`
- Laravel route/controller/model relation/resource/schema
- manifest → graph/dataflow/IR
- `DataFlowInterface`
- `InterfaceDependencyBoundary`

## Architecture

```text
Laravel source
    ↓
types/upstream
    ↓
wiring / scanner / lowering
    ↓
canonical domain semantic algebra
    ↓
InterfaceDependencyBoundary
    ↓
DataFlowInterface / graph / IR
    ↓
CLI package surface
```

## Phase 1120 repair

`packages/core/src/types/domain/semanticType.ts` is the canonical semantic-type algebra.

`packages/core/src/compiler/types/SemanticType.ts` remains only as a downstream compatibility facade. Production modules no longer import it. They import the canonical domain module directly.

The migration covers compiler artifacts, IR, query/compiler code, constraints, scanner/binders/subscanners, target lowerers, generators, and type-system helpers.

## Relation ownership

`packages/core/src/types/upstream/semanticReferences.ts` remains the authority for structural relations:

- `route_controller`
- `controller_model`
- `controller_resource`
- `model_relation`
- `resource_model`
- `response_resource`
- `route_request`
- `route_response`

Compiler scanner code may construct those upstream values from source evidence; it must not define a parallel structural relation algebra.

## DataFlowInterface

`DataFlowInterface<Input, State, Node>` remains framework-neutral. Laravel source/sink/barrier/policy semantics belong in upstream analysis configuration and input facts, not in the generic execution/query contract.

## InterfaceDependencyBoundary

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional:

`upstream → wiring → interface → downstream`.

## Manifest / graph / IR

Construction-time `RouteSyncManifest` may carry AST. Downstream graph/dataflow/IR consume `RouteSyncManifestFlow` and do not reach back into construction-time AST-bearing state.

## CLI and legacy

CLI commands consume `@routesync/core`; no production command imports `packages/core/src` directly.

`StaticLaravelScanner` remains absent from production.

## Ecommerce conservation oracle

The fixture continues to provide route, controller, model, relation, resource, migration/schema evidence for the end-to-end chain:

`route → controller → model_relation → resource → schema → manifest flow → dataflow/graph/IR`.
