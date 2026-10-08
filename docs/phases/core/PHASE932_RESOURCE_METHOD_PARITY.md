# Phase 932 — Laravel Resource Method Parity

Phase 932 extends the active route scanner from the historical `apiResource`-only route emission branch to the four Laravel resource registration methods already represented by the upstream route ADT:

- `resource`
- `apiResource`
- `singleton`
- `apiSingleton`

The canonical flow is:

```text
Laravel Route::resource/apiResource/singleton/apiSingleton
  -> route syntax vocabulary
  -> RouteDeclarationAst
  -> RouteDeclarationSemanticKind
  -> canonical resource route emitter
  -> concrete RouteEmission per controller action
  -> RouteProducer
  -> RouteDefinition.special.resource/api_resource/singleton/api_singleton
  -> RouteActionPolicyRelation
```

Default generated action sets follow Laravel 13:

```text
resource:
  index, create, store, show, edit, update, destroy

apiResource:
  index, store, show, update, destroy

singleton:
  show, create, edit, update

apiSingleton:
  show, update
```

Laravel documents these resource and singleton route sets and the middleware scope operations independently. The important architectural boundary is that resource method expansion is route semantic closure, not generic value-flow dataflow.

## Deliberate scope of Phase 932

This phase closes **default method parity**. It does not yet claim complete Laravel resource option parity for:

- `only()` / `except()` action filtering;
- `shallow()` nested-resource path rewriting;
- `creatable()` / `destroyable()` singleton variants;
- `names()` / `parameters()` route customization;
- `withTrashed()` action-scoped model binding.

Those modifiers should be carried as explicit upstream resource registration evidence and consumed by the same resource-flow resolver rather than added as parser-side special cases.

## Dataflow boundary

No policy/resource vocabulary is added to `SemanticDataflowFact`. Route resource expansion produces semantic route/action relations; generic dataflow remains reserved for value-flow reasoning. This follows the distinction between AST syntax, control-flow, call graph, and data-flow representations used by CodeQL-style analyses.
