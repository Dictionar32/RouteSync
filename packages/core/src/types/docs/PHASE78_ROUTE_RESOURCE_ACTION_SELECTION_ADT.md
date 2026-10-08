# Phase 78 — Resource action selection semantic elevation

Laravel resource routing supports `only([...])` and `except([...])` to select the generated resource actions. The Laravel meaning belongs upstream: the AAT/AST adapter preserves the method and requested action names as syntax facts; the semantic resolver intersects those names with the action set available to `resource` or `apiResource`.

```text
RouteResourceDeclarationAst
  -> RouteResourceFact
  -> resolveRouteResourceFact()       [AST-free, Laravel-aware]
  -> ResourceActionSelection + actions
  -> RouteResourceContract
  -> concrete route expansion
  -> RouteSemanticFlow                 [dumb composition]
```

`apiResource` never gains `create` or `edit`; filtering happens against its available action set. Unknown requested actions are not invented downstream.

The flow layer does not interpret `only` or `except`.
