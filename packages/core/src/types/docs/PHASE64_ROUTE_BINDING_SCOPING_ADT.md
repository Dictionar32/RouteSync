# Phase 64 — Route Binding Scoping ADT

Laravel route model binding has semantic scoping rules that should not leak into the downstream interface. Nested implicit bindings using a custom key are scoped automatically; `scopeBindings()` forces child binding scoping, while `withoutScopedBindings()` disables it.

## Pipeline

```text
Laravel source
  -> AST
  -> AST -> RouteBindingContract
  -> controller/action semantic ADT
  -> resolveRouteBindingSemantics(...)
  -> ResolvedRouteBindingContract.scoping
  -> RouteSemanticFlow
  -> dumb interface/consumer
```

The resolver receives ADTs only. It does not inspect PHP AST or route fluent syntax.

`scoping` is not an execution-order claim and does not attempt to resolve the database query.
