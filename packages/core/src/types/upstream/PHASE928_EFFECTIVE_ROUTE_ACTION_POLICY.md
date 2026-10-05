# Phase 928 — Effective Route-Action Policy Upstream Closure

Phase 928 closes the Laravel route-policy boundary without introducing a Laravel-specific dataflow vocabulary.

## Closed path

```text
RouteDefinition.capability.middleware
  + ControllerAction.policy
  + concrete ControllerReference.action
  -> resolveEffectiveControllerActionPolicyUpstream
  -> EffectiveControllerActionPolicy
  -> RouteActionPolicyRelation
```

The relation preserves:

- route identity;
- controller identity and concrete action;
- route-group versus direct-route middleware provenance;
- controller class/method middleware provenance;
- inherited controller names;
- controller authorization policy relations.

The generic `SemanticDataflowFact` algebra is not extended with middleware, authorization, or policy variants. Policy remains a semantic relation lane and is rejected by structural graph-edge projection.

## Boundary correction

`types/upstream/highLevelSourceModel.ts` now depends only on the upstream effective-policy closure. It no longer imports a scanner implementation. This prevents the upstream semantic model from depending downward into `compiler/scanner`.

## Known Laravel evidence boundary

Laravel route groups merge middleware, controller middleware can be action-scoped, and resource routes support `middlewareFor` / `withoutMiddlewareFor`. The current `RouteDefinition` carries route/group middleware and controller policy evidence, but resource middleware declarations are still represented in scanner-side resource syntax evidence rather than losslessly attached to every concrete `RouteDefinition`. Phase 928 does not infer resource provenance from `direct` middleware.

## Regression fixture boundary

Neither `examples/ecomerce-shop-source` nor `examples/ecommerce-shop-source` exists in the workspace. Existing inline e-commerce regression sources remain authoritative; no synthetic fixture is introduced.
