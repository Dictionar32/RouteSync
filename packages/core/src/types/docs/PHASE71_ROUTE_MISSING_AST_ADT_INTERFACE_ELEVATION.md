# Phase 71 — Route Missing AST → ADT → Dumb Interface

Laravel's `missing()` route behavior is semantic: a route may retain Laravel's
normal 404 behavior or provide a custom missing-model handler.

The boundary is now explicitly separated:

```text
RouteDeclarationAst (AAT)
  -> extractRouteMissingFactFromAst()
  -> RouteMissingFact
  -> resolveRouteMissingFact()       [AST-free]
  -> RouteMissingBehaviorFlow        [semantic ADT]
  -> RouteSemanticFlow                [dumb composition]
  -> interface / consumer
```

The AST adapter extracts only the fact that a custom handler exists. The
semantic resolver decides the Laravel behavior. No downstream flow is allowed
to inspect `RouteDeclarationAst` or interpret `missing()` syntax.
