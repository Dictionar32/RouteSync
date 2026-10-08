# Phase 1087 — Manifest Flow Surface Closure

## Scope

Phase 1086 closed the graph consumer boundary, but `RouteSyncManifestFlow` still transported the complete `CompleteLaravelSourceModel` container so graph and dataflow projections could dereference it.

## Finding

The complete source model is an upstream construction aggregate. Its canonical semantic slices are already explicit:

- `LaravelSemanticContractCatalog`
- `SemanticRelationGraph`
- `ManifestDataflowSeedSurface`

Keeping `CompleteLaravelSourceModel` on the downstream flow therefore widened the handoff beyond what downstream wiring needs.

## Change

`RouteSyncManifestFlow` now exposes only:

```text
RouteSyncManifestFlow
 ├── version
 ├── source
 ├── contracts: LaravelSemanticContractCatalog
 ├── relations: SemanticRelationGraph
 └── dataflowInputs: ManifestDataflowSeedSurface
```

It no longer exposes:

```text
CompleteLaravelSourceModel
CompleteSourceAst
```

The upstream `RouteSyncManifest -> RouteSyncManifestFlow` projection remains the sole wiring point that extracts the canonical slices from the construction artifact.

## Downstream topology

```text
CompleteSourceAst
      │
      ▼
CompleteLaravelSourceModel
      │
      ▼
RouteSyncManifest
      │
      │ InterfaceDependencyBoundary
      ▼
RouteSyncManifestFlow
      │
      ├── contracts ───────────────┐
      ├── relations ───────────────┤
      └── dataflowInputs ──────────┤
                                   │
              ┌────────────────────┴──────────────────┐
              ▼                                       ▼
 GraphProjectionInterface                  DataflowProjectionInterface
              │                                       │
              ▼                                       ▼
       GraphSurface                           DataflowSurface
              │                                       │
              ▼                                       ▼
           ServiceGraph                         DataFlowInterface
                                                        │
                                                        ▼
                                                        IR
```

## Semantic ownership

Routes, controllers, model relations, resources, requests, and schema-derived provenance remain upstream semantic evidence. The flow transports their already-resolved canonical semantic forms; downstream consumers do not reinterpret Laravel syntax.

The ecommerce fixture remains the reference policy:

- controller/request expressions such as `$request->user()->id` and `Order::where(...)` are value/data-flow evidence;
- model relation declarations such as `details`, `payment`, `shipping`, and `promotion` are structural relation evidence;
- `OrderResource` is response projection evidence;
- migration foreign keys are schema/provenance evidence.

Loaded Eloquent relationships may appear in serialization, but serialization is not automatically a semantic data-flow edge.

## DataFlowInterface

No change. `DataFlowInterface` remains domain-neutral and contains no Laravel, route, controller, model, relation, resource, schema, manifest, graph, or IR vocabulary.

## InterfaceDependencyBoundary

No change. The generic boundary remains directional:

```text
Upstream value
     │
     ▼
Downstream wiring interface
     │
     ▼
Downstream contract
```

## StaticLaravelScanner

No reintroduction. The legacy scanner remains absent.

## Validation

Pass:

- Phase 1082 manifest-flow boundary audit
- Phase 1084 upstream-wiring command audit
- Phase 1085 downstream-wiring surface audit
- Phase 1086 graph downstream-surface audit
- Phase 1087 manifest-flow surface audit

The full TypeScript build is not claimed because local `tsc`/`tsup` binaries are unavailable in the workspace.
