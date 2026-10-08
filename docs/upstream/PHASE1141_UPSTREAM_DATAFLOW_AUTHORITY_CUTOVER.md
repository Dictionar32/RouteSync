# Phase 1141 — Upstream Dataflow Authority Cutover

## Scope

Trace and repair of the semantic dataflow lane across:

`examples/ecommerce-shop-source -> Laravel source contracts -> CompleteLaravelSourceModel -> RouteSyncManifestFlow -> SemanticDataflowInput -> DataFlowInterface -> graph/IR consumers`

## Authority repair

The repository contained two implementations of `createSemanticDataflowJudgment()`:

- canonical: `types/upstream/semanticDataflowAuthority.ts`
- duplicate: `compiler/analysis/astDataflowAuthority.ts`

The compiler-local implementation duplicated semantic identity, reachability closure, derivation construction, and validation. It is now reduced to a compatibility re-export only.

The only implementation is now the upstream authority:

`SemanticDataflowInput -> createSemanticDataflowJudgment() -> SemanticDataflowJudgment`

The generic downstream contract remains:

`DataFlowInterface<Input, State, Node>`

and the runtime adapter remains the only bridge from the upstream judgment to that generic execution/state/query surface.

## Upstream ownership

Laravel-specific meaning remains in upstream contracts:

- route bindings / route semantic surface;
- controller semantic dataflow and query evidence;
- request validation/dataflow projection;
- resource transformation;
- model/relation semantics;
- schema/migration semantics.

`ManifestDataflowSeedSurface` assembles controller-scoped `SemanticDataflowInput` exactly once at the manifest boundary. It is seed-only and does not own closure, reachability, or solver state.

## Downstream ownership

The downstream compiler owns only generic dataflow execution/configuration and projections:

`SemanticDataflowInput`
`-> DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>`
`-> analysis/policy`
`-> SemanticDataflowIRProjection`

Graph remains structural:

`route/controller/model/relation/resource/schema`
`-> StructuralSemanticRelation`
`-> GraphEdgeRelation`
`-> ServiceGraph`

Graph does not consume dataflow closure to reconstruct structural dependencies.

## Ecommerce source evidence

`examples/ecommerce-shop-source` provides concrete Laravel controllers, requests, resources, Eloquent models/relations, routes, and migrations. Those are evidence for upstream contracts; downstream consumers do not reclassify PHP syntax from the fixture.

## External design alignment

TypeScript recommends encoding semantic variants as discriminated unions so the type system can narrow from the discriminator rather than relying on assertions.

CodeQL separates dataflow configuration (sources, sinks, barriers, additional steps) from the generic dataflow computation.

MLIR separates generic interfaces and dataflow solver infrastructure from concrete semantic/analysis implementations.

These patterns support RouteSync's boundary: upstream owns domain meaning and seed facts; the generic dataflow interface owns execution/state/query; graph and IR remain projections rather than alternate authorities.

## Verification invariants

- `createSemanticDataflowJudgment` has one production implementation.
- `compiler/analysis/astDataflowAuthority.ts` contains no solver or closure implementation.
- no `as` or `any` was introduced by this repair.
- no Laravel concept was added to `DataFlowInterface`.
- no graph/dataflow authority was merged.
- existing compatibility file remains present rather than deleted.
