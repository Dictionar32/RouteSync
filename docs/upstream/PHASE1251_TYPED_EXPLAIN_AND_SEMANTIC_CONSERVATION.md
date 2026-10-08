# Phase 1251 — Typed downstream explanation and semantic conservation

## Boundary

The canonical RouteSync direction remains:

`Laravel source → upstream semantic evidence → reasoning algebra → closed capability/contract/interface → UpstreamWiringInterface → manifest/graph/IR/CLI`.

## Changes

- `packages/cli/src/commands/explain.ts` now uses a typed read-only graph projection instead of `any`.
- `explain` remains a query/projection surface; it does not resolve Resource, Model, Response, or Route semantics.
- `packages/core/src/ir/domain/request-endpoint/endpointRefs.ts` keeps name-based `inferParamType()` isolated as legacy compatibility vocabulary. Production path-parameter IR projection consumes `RouteSemanticFlow.identity.parameters.path` and the already-resolved `RouteParameter.type`.
- `packages/cli/src/commands/annotate/template/resourceDiscovery.ts` consumes materialized upstream response semantics from the manifest rather than PHP regex classification.
- `scripts/audit/routesync-architecture.cjs` now gates typed/evidence-only `explain` projection.

## Semantic conservation law

Once a semantic fact is closed upstream, downstream may project, query, lower, serialize, or explain it. Downstream must not reconstruct the fact from names, regexes, HTTP-method heuristics, or generated naming conventions.

## External alignment

MLIR interfaces separate generic analyses/transformations from concrete operation semantics and support compositional interface inheritance. CodeQL separates AST nodes from data-flow graph nodes and uses graph closure for flow reasoning. Laravel route model binding demonstrates that route semantics can include model identity, custom keys, and scoping, so these meanings belong to source/upstream resolution. TypeScript 7 demonstrates that implementation substrate can change while preserving semantic behavior and compatibility.
