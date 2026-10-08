# Phase 68 — Route Constraint Semantic Elevation

Laravel 13 documents route constraints as semantic routing rules: `where` accepts a regular expression, helper methods provide common patterns (`whereNumber`, `whereAlpha`, `whereAlphaNumeric`, `whereUuid`, `whereUlid`, and `whereIn`), and nested route groups merge `where` conditions. Global `Route::pattern` is a separate application-wide constraint mechanism.

This phase deliberately separates syntax facts from semantic meaning:

```text
Laravel source
  -> RouteDeclarationAst
       -> routeConstraintAstAdapter
  -> RouteConstraintFact[]
       -> routeConstraintFlowResolver
  -> RouteConstraintContract[]
  -> RouteConstraintFlow
  -> RouteSemanticFlow
  -> interface / flow consumer
```

## Boundary rules

- `RouteDeclarationAst` remains an upstream syntax artifact.
- `routeConstraintAstAdapter` extracts facts only: parameter, source, helper kind, and optional raw regex value.
- `routeConstraintFlowResolver` is AST-free and is the only layer that turns those facts into semantic matchers.
- `RouteConstraintContract` no longer mirrors an AST `value`; it exposes a semantic `matcher`.
- Group and route constraints are preserved in merged order rather than applying an unverified same-parameter override rule. Laravel documents nested group `where` conditions as merged.
- `RouteSemanticFlow` remains a dumb composition contract and performs no Laravel interpretation.

## Intentionally not guessed

`whereIn` and global `Route::pattern` are not synthesized from incomplete token information in this phase. They need their own AAT facts because `whereIn` carries a value collection and `Route::pattern` is registered outside an individual route declaration.
