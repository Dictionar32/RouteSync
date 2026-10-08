# Phase 1136 — Laravel Interface Boundary Trace

## Authority

The canonical boundary remains:

`Laravel source evidence -> upstream semantic interfaces -> downstream wiring interfaces -> consumer materialization`

The generic `DataFlowInterface<Input, State, Node>` is unchanged. It remains execution/state/fixpoint/query only. Laravel route/controller/model/relation/resource/schema policy is not encoded in it.

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional. Upstream contracts do not implement downstream materialization boundaries merely to become consumable.

## Laravel semantic interfaces traced

- `RouteBindingInterface` owns route parameter/model-binding evidence.
- `ModelRelationInterface` owns Eloquent relation evidence, semantic relations, reconciliation, and schema relation linkage.
- `SchemaInterface` owns closed migration-derived schema semantics.
- `MigrationInterface` owns the closed migration semantic input consumed by schema production.
- `RouteSemanticSurface`, `ControllerDataflowSurface`, `ModelRelationSurface`, and `ResourceTransformationSurface` expose stable semantic slices through the high-level contract catalog.
- `RouteSyncManifest` is the construction boundary and may retain AST; `RouteSyncManifestFlow` is the AST-free downstream semantic flow.
- `RouteSyncManifestFlowProjectionInterface`, `RouteSyncManifestDataflowProjectionInterface`, `RouteSyncManifestGraphProjectionInterface`, and `SemanticDataflowIRProjectionInterface` are downstream wiring/materialization boundaries.

## Corrected semantic ADT consumption

The previous implementation incorrectly treated `ControllerModelOrigin` / `ModelReference` as if both used the historical `model_class` representation everywhere. The canonical upstream contracts are now consumed through relational variant folds:

- `ControllerResourceBinding.model` is `ControllerModelOrigin`; `model_class` is one closed variant and `table` is another.
- `RouteParameterBinding.model` is already `ModelReference`; it is never checked against `model_class`.
- No `as Extract<...>` cast is used in these production boundary functions.

This keeps the type authority upstream and prevents downstream projection from reconstructing or coercing Laravel model identity.

## Dataflow boundary

Route/controller/resource/model/schema facts remain producer evidence. They are projected into `SemanticDataflowInputFact` and consumed by the canonical semantic dataflow authority. `DataFlowInterface` remains the generic downstream execution contract.

This agrees with CodeQL's separation of a generic dataflow solver from source/sink/step configuration and with MLIR's separation of generic analysis infrastructure from dialect-specific interfaces/semantics.

## Legacy scanner

`StaticLaravelScanner` remains absent from production implementation/reference. CLI `scan` and `sync` consume `manifestBuilder: ManifestBuilderInterface` directly. Historical phase documents and compatibility tests may mention the legacy name, but they are not production authority.

## CLI / ecommerce trace

`examples/ecommerce-shop-source` is consumed through the CLI producer path:

`SourceProjectIdentity -> manifestBuilder.build -> RouteSyncManifest -> RouteSyncManifestFlow -> dataflow/graph/route-manifest/IR projections`

The CLI does not call the legacy scanner facade.

## Placeholder policy

The retained upstream placeholder files remain present and empty (0 bytes). They are not deleted and are not production imports.
