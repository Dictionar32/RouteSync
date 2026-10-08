# Phase 916 — Upstream Evidence Boundary Closure

This phase closes the second-order evidence boundary after the controller cutover.

## Evidence authorities

The scanner owns concrete PHP ASTs and adapts them once into upstream evidence:

```text
PHP AST
  -> RouteDeclarationEvidence
  -> ControllerDeclarationEvidence
  -> ProviderSourceEvidence
  -> semantic producer / upstream contracts
```

`RouteDeclarationEvidence`, `ControllerDeclarationEvidence`, and `ProviderSourceEvidence` are explicit upstream evidence contracts. Provider evidence is no longer embedded in the broad `application.ts` vocabulary; it has its own `providerEvidence.ts` authority, matching the route/controller boundary pattern.

## Producer invariant

`controllerProducer.ts` and `providerProducer.ts` must not mention concrete scanner AST types or AST canonicalizer names. AST adaptation remains in scanner-owned adapters/canonicalizers.

This is consistent with the useful distinction in CodeQL: a semantic data-flow graph is not the same representation as the source AST, and semantic analysis should operate on its value/flow representation rather than syntax nodes. citeturn0search4turn0search0

MLIR similarly uses interfaces to let generic analyses operate without encoding concrete operation/dialect implementation knowledge. citeturn0search2

## Laravel implication

Laravel controller behavior is declarative across route middleware, controller middleware, and PHP attributes. Laravel 13 explicitly supports controller `#[Middleware]` and `#[Authorize]`, while `HasMiddleware` exposes controller middleware through a static interface. The upstream boundary should therefore carry normalized controller evidence/contracts rather than PHP attribute AST objects. citeturn0search9turn0search10

## E-commerce fixture policy

The current workspace does not contain either `examples/ecomerce-shop-source` or `examples/ecommerce-shop-source`. Existing e-commerce regression tests remain the available workload. The phase deliberately does not fabricate a missing source tree.
