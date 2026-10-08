# Phase 1119 — Upstream → Wiring → Interface → Downstream Trace

## Canonical direction

```text
Laravel source
  ↓
upstream evidence / vocabulary
  ↓
wiring + explicit lowering boundary
  ↓
downstream interface
  ↓
graph / dataflow / IR / CLI
```

## Canonical semantic ownership

The canonical upstream semantic surfaces for the requested regression chain are:

- `types/upstream/route.ts`
- `types/upstream/controller.ts`
- `types/upstream/modelRelation.ts`
- `types/upstream/resource.ts`
- `types/upstream/schema.ts`
- `types/upstream/manifest.ts`
- `types/upstream/semanticReferences.ts`

`StructuralSemanticRelation` remains the canonical relation vocabulary for route/controller/model/resource/response relationships. Compiler code may lower or project these facts, but must not redefine those relation kinds.

## Manifest boundary

`RouteSyncManifest` is a construction artifact and may carry `CompleteSourceAst` for explicit lowering. The downstream semantic flow is `RouteSyncManifestFlow`, which is AST-free.

```text
RouteSyncManifest
  ↓ construction-to-flow wiring
RouteSyncManifestFlow
  ↓
  ├── graph surface
  ├── dataflow surface
  └── IR input
```

Graph, dataflow, and IR must consume the flow/surface contracts rather than reaching back to the construction manifest.

## DataFlowInterface recommendation

Keep `DataFlowInterface<Input, State, Node>` generic. Framework semantics such as Laravel route/controller/resource/model/source/sink policy belong in upstream semantic facts and analysis configuration, not in the generic engine contract.

## InterfaceDependencyBoundary recommendation

Keep:

```ts
interface InterfaceDependencyBoundary<Upstream, Downstream> {
  readonly project: (upstream: Upstream) => Downstream;
}
```

The downstream layer owns the boundary. Upstream contracts do not import or implement it merely to become consumable.

## Phase 1119 repair

Removed the unused `GraphCatalogSource` export from the graph projection interface. It exposed the complete `LaravelSemanticContractCatalog` despite the graph already having a minimal `Graph*Surface`. The graph boundary now exposes only the required downstream slice.

## Regression oracle

`examples/ecommerce-shop-source` remains the end-to-end conservation oracle for:

```text
route → controller → model_relation → resource → schema
       → manifest flow → graph/dataflow/IR
```

Legacy `StaticLaravelScanner` remains absent from production code.
