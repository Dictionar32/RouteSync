# Phase 1022 — Dataflow Fact Provenance Boundary

Phase 1022 refines the producer boundary identified in Phase 1021. A manifest-level `SemanticDataflowInput` may intentionally combine route, controller, resource, and scanner-backed controller query facts, so the input-level `origin.lineage` is not granular enough for analysis-specific source/sink policy.

## Change

`SemanticDataflowFactLineage` is now carried by seed `dependency` and `value_flow` facts. The lineage records:

- `producer`: `route | controller | model_relation | resource | schema`
- `identity`: the exact semantic producer identity for the fact
- `source`: the producer source span
- `closed: true`

The semantic fact equality key deliberately ignores lineage. Provenance is metadata, not semantic identity. This prevents the same semantic edge emitted by two producers from becoming two distinct fixed-point edges.

## Producer assignments

- route parameter binding facts → `route`
- controller scanner semantic facts → `controller`
- controller query facts → `controller`
- model/resource/response projection facts → `resource`
- model-relation and schema remain structural evidence until a concrete semantic dataflow projection exists; no synthetic dataflow facts are invented here

## Ownership

`DataFlowInterface` remains execution-only:

`seed → derive → close → reaches`

`DataFlowConfigInterface` remains analysis-owned and downstream of semantic execution. It is not embedded in `SemanticDataflowInterface`.

`DataFlowProjectionInterface` remains outside upstream and is consumed by Graph and IR projection only.

## External alignment

CodeQL models source/sink/barrier/additional-flow-step as analysis configuration rather than intrinsic properties of every dataflow node. Its global flow module consumes that configuration. MLIR separates child analyses from a general solver and runs them to a fixed point. Soufflé similarly treats recursive relations as least-fixed-point computations while provenance can be carried separately from relation identity.

The RouteSync consequence is that producer lineage should be available to future analysis configuration contributors without changing the semantic execution authority.

## Next frontier

The next safe migration is a composable analysis configuration contributor layer over fact-level lineage. It should not classify a producer globally as source or sink. A concrete analysis must choose which route/controller/model-relation/resource/schema facts participate as sources, sinks, barriers, or additional flow steps.
