# Phase 934 — Resource Modifier Closure

## Finding

The Phase 933 resource-flow authority was canonical, but the active `RouteScanner` still constructed `defaultApiResourceRegistration()` for every resource declaration. The parser therefore dropped resource modifiers before the upstream resolver:

- `only(...)`
- `except(...)`
- `shallow()`
- `scoped()`
- `creatable()`
- `destroyable()`

This was semantic data loss, not a data-flow problem.

## Closure

```text
Laravel fluent resource declaration
  -> RouteDeclarationAst modifier evidence
  -> RouteResourceRegistration
  -> resolveRouteResourceFlow
  -> RouteResourceActionPlan
  -> concrete RouteEmission
  -> RouteProducer
  -> RouteActionPolicyRelation
```

The emitter no longer reconstructs the Laravel action table. It only builds the canonical upstream registration from already captured declaration evidence and consumes `resolveRouteResourceFlow`.

## Deliberate boundary

`names(...)`, `parameters(...)`, and action-scoped `withTrashed(...)` remain a separate frontier because their current upstream contracts need richer pair/action-scope representations. They must not be approximated as untyped strings or folded into generic `SemanticDataflowFact`.

Generic dataflow remains reserved for semantic value flow. Resource registration semantics remain in the upstream route relation lane.
