# Phase 77 — Laravel resource route ADT elevation

Laravel documents `Route::resource` as generating a fixed resource action set, while `Route::apiResource` omits `create` and `edit`. `withTrashed()` without arguments applies to `show`, `edit`, and `update` resource routes; an explicit array selects a subset.

The boundary is:

```text
RouteResourceDeclarationAst (AAT)
  -> RouteResourceFact (syntax fact)
  -> resolveRouteResourceFact() [AST-free, Laravel-aware]
  -> RouteResourceContract (semantic ADT)
  -> downstream interface / flow
```

The AST adapter does not decide which actions Laravel generates or what an empty `withTrashed()` means. Those decisions live in the semantic resolver.

The resource contract is intentionally separate from `RouteSemanticFlow`: a resource declaration expands into multiple concrete routes, so generated-route expansion belongs upstream. The downstream flow must receive concrete semantic route contracts rather than reconstructing Laravel resource behavior.
