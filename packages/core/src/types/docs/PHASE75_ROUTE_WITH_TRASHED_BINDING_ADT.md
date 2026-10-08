# Phase 75 — Laravel `withTrashed()` Binding ADT

Laravel documents `withTrashed()` as a route-level instruction that changes implicit Eloquent model binding so soft-deleted models may be retrieved.

The implementation keeps that knowledge upstream:

```text
RouteDeclarationAst (AAT)
  -> extractRouteBindingFactsFromAst()
  -> RouteBindingFact { withTrashed }
  -> resolveRouteBindingFacts() [AST-free]
  -> RouteBindingContract { withTrashed }
  -> resolveRouteBindingSemantics()
  -> ResolvedRouteBindingContract { withTrashed }
  -> RouteSemanticFlow [composition only]
```

The flow does not inspect `withTrashed`, infer soft-delete behavior, or parse Laravel syntax.


## Phase 76 semantic gating

`withTrashed` is a Laravel implicit Eloquent model-binding semantic. It must not be propagated to ordinary route parameters or implicit enum bindings. The cross-source resolver now gates the semantic on successful model resolution:

```text
RouteBindingContract(withTrashed=true)
        ↓
resolve model from action parameter
        ↓
implicit Eloquent model?
   yes /       \ no
  true         false
```

This keeps Laravel knowledge upstream and prevents a route-level syntax flag from leaking into unrelated binding kinds. Resource `withTrashed([...])` action subsets remain intentionally unmodeled until resource-generated actions exist in the AST/ADT boundary; they must not be guessed.
