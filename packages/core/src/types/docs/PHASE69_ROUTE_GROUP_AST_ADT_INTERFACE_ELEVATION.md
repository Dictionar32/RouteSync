# Phase 69 — Route Group AAT → ADT → Interface Elevation

The route-group semantic boundary is now explicitly split into two upstream stages:

```text
RouteDeclarationAst (AAT)
  -> extractRouteGroupFactsFromAst()
  -> RouteGroupFact
  -> resolveRouteGroupFacts()          [AST-free, Laravel/domain-aware]
  -> RouteGroupContext                 [semantic ADT]
  -> RouteSemanticFlow                 [dumb composition]
```

`routeGroupContextResolver.ts` remains only as the upstream bridge for existing
callers. It no longer contains Laravel/domain interpretation itself.

The downstream flow does not parse group syntax, reconstruct prefixes,
interpret binding scope, or manufacture domain/controller/middleware semantics.
