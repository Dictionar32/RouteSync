# Phase 944 — Upstream Consumer Closure

Phase 944 closes the trace from the canonical upstream contracts to their downstream consumers.

## Ownership

The canonical upstream contract remains `packages/core/src/types/upstream`. No `packages/core/src/upstream` directory is introduced. Scanner producers may import canonical upstream types, while `types/upstream` remains scanner-independent.

## Laravel policy lane

Laravel controller/resource policy evidence is preserved as semantic relations:

`ControllerPolicyRelation -> EffectiveControllerActionPolicy -> ControllerActionPolicyRelation / RouteActionPolicyRelation -> CompleteLaravelSourceModel.relations`

The graph compiler intentionally projects only `StructuralSemanticRelation`. Policy relations therefore do not become graph edges by accidental structural coercion.

## Generic dataflow lane

Scanner-local semantic knowledge is adapted to `SemanticDataflowInput` using only `dependency` and `value_flow` seed facts. `reaches` is derived exclusively by `astDataflowAuthority` through the fixed-point closure. The canonical `semanticDataflowInterfaceFromJudgment` factory is consumed by the analysis interface.

The legacy `createAstDataflowInterface` compatibility name has no production consumers and is not part of the upstream contract.

## Ecommerce fixture

No `examples/ecomerce-shop-source` or `examples/ecommerce-shop-source` tree is recreated. The maintained fixture remains `packages/sdk/tests/fixtures/ecommerce-shop-source`.

## External contract alignment

Laravel 13 documents controller middleware via `HasMiddleware`, `#[Middleware]`, `#[WithoutMiddleware]`, and `#[Authorize]`, plus resource `middlewareFor` and `withoutMiddlewareFor`. RouteSync keeps these framework-specific semantics in the policy lane rather than turning them into generic dataflow facts.

## Audit

`audit:phase944-upstream-consumer-closure` verifies:

- canonical upstream exists and has no reverse imports;
- policy relations reach the complete source model;
- graph projection accepts only structural relations;
- dataflow adapter supplies seed facts only;
- dataflow authority owns `reaches` closure;
- downstream analysis consumes the canonical interface factory;
- no production consumer depends on the legacy AST dataflow factory name.
