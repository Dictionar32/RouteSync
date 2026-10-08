# Phase 73 — Laravel `whereIn()` AST → ADT → dumb flow

Laravel 13 documents `whereIn()` as a route constraint that restricts a parameter to a finite set of values. It can receive literal values or enum cases.

The implementation keeps the semantic boundary explicit:

```text
RouteDeclarationAst (AAT)
  -> routeConstraintAstAdapter
  -> RouteConstraintFact { kind: 'in', values }
  -> routeConstraintFlowResolver (AST-free)
  -> RouteConstraintContract { matcher: { kind: 'in', values } }
  -> RouteConstraintFlow
  -> RouteSemanticFlow
```

`RouteSemanticFlow` does not interpret `whereIn()`. It only composes the already-resolved constraint contract.

The parser only extracts literal string values from the array form. Enum expressions are deliberately not synthesized from incomplete token information; they require a richer upstream PHP expression fact before semantic resolution can claim their concrete values.
