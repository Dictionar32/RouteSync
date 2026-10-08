# Phase 79 — Laravel resource names/parameters semantic elevation

Laravel resource routes support `names([...])` to override generated route names and `parameters([...])` to override generated URI parameter names. These are documented resource semantics, not downstream flow decisions.

Pipeline:

```text
RouteResourceDeclarationAst
  -> RouteResourceFact
  -> resolveRouteResourceFact() [AST-free, Laravel-aware]
  -> RouteResourceContract
       - actions
       - selection
       - routeNames
       - parameters
       - withTrashed
  -> concrete route expansion / interface
  -> RouteSemanticFlow [dumb composition]
```

The lexer preserves only string-pair syntax. The adapter performs no Laravel interpretation. The semantic resolver converts the facts to `RouteName` and `RouteParameterName`, filters route-name overrides to actions actually emitted by the selected resource action set, and applies a parameter override only when its resource key matches the declaration's resource.

No resource-name or parameter-name interpretation is added to `RouteSemanticFlow`.
