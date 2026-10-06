# Phase 1088 — Graph Semantic Surface Minimization

## Tujuan

Menutup kebocoran downstream pada graph tanpa mengubah `DataFlowInterface` atau arah `InterfaceDependencyBoundary`.

## Perbaikan

`RouteSyncManifestGraphSurface` tidak lagi `extends LaravelSemanticContractCatalog`. Graph menerima slice eksplisit:

- `GraphModelSurface`: `identity` + canonical `semantic` model definition.
- `GraphServiceSurface`: `name`, `methods`, `dependencies`, `resolvedDependencies`.
- `GraphControllerSurface`: `controller`, `action`.
- `GraphRouteSurface`: `identity.path`, `bindings.target`.
- `SemanticRelationGraph`: authority struktural untuk relation-to-edge projection.

Projection tetap downstream-owned:

`InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>`

Upstream `RouteSyncManifestFlow` tetap membawa katalog canonical; projection memotongnya menjadi surface graph. Graph compiler tidak lagi bergantung pada `ModelHighLevelContract`, `RouteHighLevelContract`, `ControllerActionFlowContract`, atau `ServiceSemanticContract`.

## DataFlowInterface

Tidak diubah. Generic `DataFlowInterface<Input, State, Node>` tetap domain-neutral dan hanya menjadi runtime state/closure contract pada lane dataflow. `InterfaceDependencyBoundary<Upstream, Downstream>` tetap dimiliki downstream wiring.

## Laravel evidence

Fixture ecommerce tetap menunjukkan pemisahan evidence: route/controller/resource menghasilkan semantic value-flow evidence, sedangkan Eloquent model relations dan migration foreign keys menjadi structural evidence. Laravel 13 mendokumentasikan bahwa loaded Eloquent relationships ikut terserialisasi saat model dikonversi ke array/JSON, sehingga relation-to-resource projection tetap harus melalui canonical semantic relations/resource contracts, bukan menjadikan semua model relation sebagai dataflow edge.

## Validasi

Audit Phase 1088 dan regression audits Phase 1085, 1086, 1087 lulus. Full TypeScript build belum dapat dijalankan karena workspace tidak memiliki `node_modules/.bin/tsc`/TypeScript runtime lokal.
