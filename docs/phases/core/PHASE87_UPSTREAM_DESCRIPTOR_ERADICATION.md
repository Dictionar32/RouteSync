# Phase 87 — Upstream Semantic Boundary Without Descriptor Layer

Laravel 13 routing semantics are resolved from typed syntax facts into the existing upstream ADTs. The intermediate `descriptors` layer is removed entirely.

## Boundary

```text
Laravel/PHP syntax
  -> RouteDeclarationAst / RouteResourceDeclarationAst
  -> typed syntax facts
  -> upstream Laravel semantic resolvers
  -> existing semantic ADTs
  -> RouteSemanticFlow
  -> downstream consumer
```

There is no `compiler/scanner/descriptors` directory and no source import/path referring to that layer.

## Control-flow and absence rules

- Semantic upstream code has no `=== undefined` / `=== null` checks.
- Semantic upstream code has no nullish-coalescing fallback.
- Semantic upstream code has no ternary data construction.
- Optional semantic inputs use the existing `Presence<T>` ADT.
- Existing ADTs are reused; no parallel descriptor interfaces are introduced.
- Missing data remains explicit as an `absent` variant instead of becoming an empty collection or fabricated default datum.
- AST optionality remains at the syntax boundary only.

## Middleware elevation

Controller middleware applicability is represented by the existing `RouteMiddlewareScope` ADT. The semantic input now uses `Presence<T>` for optional action/controller declarations, removing optional properties and default `?? []` construction from the resolver.

## Laravel basis

Laravel documents route-group middleware and `where` merging, scoped bindings, `withoutScopedBindings`, and resource registration APIs including `only`, `except`, `middleware`, `middlewareFor`, `withoutMiddlewareFor`, `where`, `shallow`, `scoped`, and `withTrashed`. These are upstream semantic facts, not downstream flow decisions.
