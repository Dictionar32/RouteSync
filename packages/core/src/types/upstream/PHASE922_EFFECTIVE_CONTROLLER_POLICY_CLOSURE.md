# Phase 922 — Effective Controller Policy Closure

Phase 922 closes the Laravel controller policy boundary before generic semantic dataflow.

## Authority

`EffectiveControllerActionPolicy` is the canonical semantic result for one concrete controller action.

The resolver now:

- computes direct controller inheritance closure from `ControllerInheritanceRelation`;
- imports inherited controller policy relations from an explicit policy catalog;
- filters controller middleware by concrete action before route middleware closure;
- filters `ControllerAuthorizationRelation` by concrete action;
- keeps route/resource/controller middleware as domain policy rather than `SemanticDataflowFact` variants;
- preserves provenance and inherited-controller identities.

## Authorization applicability

`ControllerAuthorizationRelation` now carries `ControllerPolicyActionScope`. A class-scoped authorization is `all`; a method-scoped authorization is represented as `only` for the concrete method action when projected by the scanner.

This avoids treating `Authorize` as an unscoped controller-wide fact when Laravel attaches it to a method.

## Inheritance

The controller scanner now exposes direct inheritance as an upstream-owned `ControllerInheritanceRelation` on `ControllerDeclarationEvidence`. The effective-policy resolver computes the transitive parent closure without introducing AST dependencies.

## Dataflow boundary

The policy closure is intentionally upstream of `SemanticDataflowIdentity` and `SemanticDataflowFact`. Middleware and authorization remain Laravel semantic policy; generic dataflow consumes the closed policy result.

## E-commerce corpus

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` are not present. Existing inline e-commerce regression sources remain the regression corpus; no synthetic fixture is introduced.
