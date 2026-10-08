# Phase 70 — Route Binding AAT → ADT → Interface Elevation

Route URI binding syntax now follows the same upstream split as middleware,
constraints, and route groups:

```text
RouteDeclarationAst (AAT)
  -> extractRouteBindingFactsFromAst()
  -> RouteBindingFact
  -> resolveRouteBindingFacts()       [AST-free semantic resolver]
  -> RouteBindingContract             [semantic ADT]
  -> cross-source binding resolution
  -> RouteSemanticFlow                [dumb composition]
```

The binding contract resolver now accepts only `RouteBindingFact` values.
AST extraction is exclusively owned by `routeBindingAstAdapter.ts`; there is no
AST-to-semantic compatibility path inside the resolver. It does not contain Laravel semantic interpretation.

This preserves `RouteAst` and the producer path while preventing downstream
interfaces/flows from reconstructing binding meaning from AST syntax.
