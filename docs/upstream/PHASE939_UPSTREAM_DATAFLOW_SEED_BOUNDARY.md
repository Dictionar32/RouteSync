# Phase 939 — Upstream Dataflow Seed Boundary

## Trace

The canonical upstream semantic dataflow contract remains:

`packages/core/src/types/upstream/semanticDataflowInterface.ts`

The producer boundary remains:

`packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts`

The solver authority remains:

`packages/core/src/compiler/analysis/astDataflowAuthority.ts`

There is intentionally no `packages/core/src/upstream/` directory. `types/upstream` owns the stable semantic contract; producer-specific adapters live beside their producer.

## Seed invariant

`SemanticDataflowInput` now accepts only `SemanticDataflowInputFact`:

- `dependency`
- `value_flow`

The derived `reaches` fact is excluded from producer input. `astDataflowAuthority` alone creates reach seeds and computes the least fixed-point transitive closure.

This prevents a producer from smuggling derived solver state into the upstream contract.

## Laravel boundary

Laravel-specific semantics remain separate relations, including `RouteMiddlewareSemanticInput` and `RouteActionPolicyRelation`. They should be resolved into effective route/controller/action semantics before being adapted to generic dataflow facts. Laravel names such as `middlewareFor` and `withoutMiddlewareFor` must not become variants of `SemanticDataflowFact`.

## Example corpus

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` are not physical source authorities. Test-owned ecommerce fixtures remain under `packages/sdk/tests/fixtures/ecommerce-shop-source`. Production code contains no live references to the historical example paths.

## External alignment

- CodeQL separates source/sink configuration and flow/path computation.
- MLIR uses interfaces to decouple generic analyses from concrete dialect implementations and provides a general data-flow solver.
- Laravel exposes resource-controller middleware semantics at route/action level; those semantics belong to the Laravel relation layer, not the generic dataflow fact algebra.
