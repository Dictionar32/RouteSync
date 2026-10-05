# Phase 893 — Upstream Controller Method Evidence

Phase 893 closes two safe upstream evidence gaps found in Phase 892.

## Changes

1. `ControllerMethodAst` now carries `ControllerMethodVisibilityAst`.
2. Controller method parsing derives explicit `public`, `protected`, and `private` evidence; absent visibility is represented as `implicit`.
3. `ControllerFailureContract` records an observed HTTP abort status without requiring an `ExceptionName`. An exception identity is not synthesized when the source only provides `abort(status)`.
4. `controllerFailureContractFromMethod()` projects the first canonical controller error evidence into the upstream failure contract.

## Deliberate boundary

`ControllerMethodContract` is **not** fully projected yet. Its `operations` field still requires a canonical producer. This phase therefore raises evidence authority without fabricating empty operation semantics.

## Workload

The canonical checked-in e-commerce fixture is `packages/sdk/tests/fixtures/ecommerce-shop-source/`. Phase 760 keeps the workload inline in its regression test, with the fixture path used only as provenance. No `examples/...` source tree is an authority.

## External design comparison

The direction follows Code Property Graph practice: method declarations and relations are represented as graph facts rather than inferred from downstream consumers. MLIR similarly uses interfaces to expose semantic capabilities without coupling analyses to concrete operation implementations.
