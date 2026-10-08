# Phase 82 — Laravel Resource Interface Elevation

Laravel resource registration semantics are now elevated upstream instead of being reconstructed by downstream flow.

Implemented semantic interface:

- resource / apiResource
- singleton / apiSingleton
- nested resource path (`photos.comments`)
- `shallow()`
- `scoped([...])`
- singleton `creatable()` / `destroyable()`

Pipeline:

```text
RouteResourceDeclarationAst
  -> RouteResourceFact
  -> RouteResourceContract.registration
  -> dumb flow / consumer
```

The AST adapter only preserves syntax facts. Laravel action selection and resource semantics remain in the semantic resolver.
