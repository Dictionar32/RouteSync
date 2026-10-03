# Phase 80 — Upstream Fact Value ADT Elevation

Phase ini memperketat boundary AST/AAT -> Fact -> semantic ADT.

## Boundary

```text
Laravel syntax
  -> RouteDeclarationAst / RouteResourceDeclarationAst
  -> typed syntax facts
  -> Laravel semantic resolver
  -> semantic ADT
  -> interface / flow
```

## Changes

- `RouteResourceFact` no longer carries free `string` values for resource/controller/action/name/parameter data. Named values use existing name value objects and syntax literals use `StringValue`.
- `RouteGroupFact` uses typed middleware/controller/domain/parameter facts and `StringValue` for literal prefix fragments.
- `RouteBindingFact` uses `RouteParameterName`, `StringValue`, and a presence ADT for `withTrashed`.
- `RouteMissingFact` uses a discriminated fact union instead of a boolean flag.
- `RouteBindingContract` and `ResolvedRouteBindingContract` expose `withTrashed` as an explicit semantic ADT (`enabled` / `disabled`) rather than a boolean.
- Semantic resolvers consume these typed facts and no longer reconstruct names from free strings.

## Principle

The AST adapter is a dumb syntax adapter. Laravel interpretation happens in the semantic resolver. The downstream route interface/flow receives already-elevated semantic data and does not parse, normalize, or infer these facts.

Laravel route-group attributes and resource customization remain upstream semantics, consistent with the Laravel routing/controllers documentation.
