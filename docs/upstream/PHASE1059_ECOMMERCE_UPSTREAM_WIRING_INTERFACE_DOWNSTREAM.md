# Phase 1059 — Ecommerce upstream → wiring → interface → downstream trace

## Decision

The canonical dependency direction is:

`Laravel route/controller/request/model-relation/resource/schema evidence`
`→ upstream semantic contracts / manifest seed`
`→ semanticDataflowAuthority`
`→ semanticDataflowDataFlowAdapter`
`→ generic `DataFlowInterface``
`→ downstream analysis / IR / query consumers.

Structural/provenance evidence remains a separate lane:

`model relations + schema relations`
`→ StructuralSemanticRelation`
`→ GraphEdgeRelation`
`→ GraphEdgeRelationSink`
`→ `ServiceGraph`.

`DataFlowProjectionInterface` is not a general-purpose downstream marker. It is only the specialization for a downstream projection whose upstream value is actually a `DataFlowInterface`. Therefore IR uses it, while graph uses the more general `InterfaceDependencyBoundary<RouteSyncManifestFlow, ServiceGraph>`.

## Fixture proof

The ecommerce fixture contains concrete route declarations, controller request/resource/load evidence, model relations, resource serialization, and migration foreign-key/schema evidence. Model `belongsTo`/`hasMany` and migration foreign keys are not promoted to value flow merely because they connect entities; they remain structural/provenance unless explicit semantic dataflow evidence exists.

## Repairs

- Registered the existing Phase 1057 audit in the package scripts; the audit existed but was not callable through `npm run`.
- Added a Phase 1059 end-to-end audit covering the canonical dataflow contract, directional dependency boundary, authority/wiring split, graph/IR consumers, upstream import isolation, and the ecommerce fixture.
- No production semantic authority was widened or duplicated.

## External design alignment

MLIR uses generic interfaces so analyses and transformations can operate without encoding concrete operation/dialect knowledge. LLVM separates analysis computation/caching from passes and uses explicit analysis results. CodeQL separates a generic dataflow solver from source/sink/barrier configuration. These patterns support keeping RouteSync's generic `DataFlowInterface` small and domain-neutral while domain policy stays in upstream evidence and downstream analysis configuration.
