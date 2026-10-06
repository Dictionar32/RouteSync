# Phase 1094 — Upstream → Wiring → Interface → Downstream Closure

Phase 1094 closes the dependency-direction proof after the Phase 1093 graph relation materialization closure.

## Canonical direction

`upstream semantic authority → downstream wiring → generic interface → downstream analysis/materialization`

The generic direction is represented by:

`InterfaceDependencyBoundary<Upstream, Downstream>`

with `project(upstream) -> downstream`.

## Dataflow lane

`SemanticDataflowAuthority`
`→ SemanticDataflowInput`
`→ SemanticDataflowRuntimeBoundary`
`→ `DataFlowInterface`
`→ analysis
`→ SemanticDataflowIRProjection`

`DataFlowProjectionInterface` remains a strict specialization of the generic dependency boundary where the upstream value is itself a `DataFlowInterface`.

The upstream semantic types do not import or implement the downstream boundary.

## Graph lane

`Route / Controller / ModelRelation / Resource / Schema evidence`
`→ StructuralSemanticRelation`
`→ GraphEdgeRelation`
`→ GraphEdgeRelationSink`
`→ ServiceGraph`

Graph remains structural/provenance materialization and does not use `DataFlowProjectionInterface` as its authority.

## CLI

`packages/cli/src/commands/scan.ts` and `sync.ts` consume `@routesync/core` public exports. They do not import `types/upstream` or core source-internal modules directly.

## Legacy scanner

`StaticLaravelScanner` has no active production implementation/reference. Historical phase documents are not production dependencies.

## Cleanup rule

No `types/upstream` file is emptied merely because its direct consumer count is small. A file is a vacuum candidate only after proving zero production references, zero barrel/public exports, and zero transitive semantic contract usage.

## Validation

`audit-phase1094-upstream-wiring-interface-downstream.cjs` proves the dependency direction, CLI surface isolation, generic dataflow neutrality, public contract exports, and legacy scanner absence.
