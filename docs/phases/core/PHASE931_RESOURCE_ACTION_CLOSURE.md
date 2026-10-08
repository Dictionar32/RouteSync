# Phase 931 — Resource Action Policy Closure

Phase 931 closes Laravel resource middleware rules at the concrete route-action policy boundary.

## Canonical path

```text
RouteResourceMiddlewareAst
  -> RouteResourceMiddlewareRule
       scope: all | only | except
       include/exclude middleware
  -> RouteDefinition.special.resource.middleware
  -> RouteActionPolicy effective closure
  -> RouteActionPolicyRelation
```

The resource rule retains its scope instead of encoding `middleware()` as an empty action list. This is important because an empty `only` set means no action applies, while Laravel `middleware()` means all generated resource actions.

## Policy boundary

Resource middleware remains a policy relation. It is not projected into `GraphEdgeRelation` and is not represented as `SemanticDataflowFact`.

## Laravel semantics

- `middleware()` applies to all resource methods.
- `middlewareFor()` applies only to named resource methods.
- `withoutMiddlewareFor()` excludes named middleware for named resource methods.
- Route-group middleware may also be removed by resource `withoutMiddlewareFor()` as demonstrated by Laravel's resource controller documentation.

## Regression

The Phase 931 regression checks that an `auth` route-group declaration excluded for `index` is removed while a resource-scoped `verified` declaration remains effective for `index`.

No `examples/ecomerce-shop-source` or `examples/ecommerce-shop-source` fixture is fabricated; existing inline e-commerce regression corpus remains authoritative.
