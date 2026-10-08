# Phase 71 — Route Binding Semantic Boundary

## Target architecture

```text
Laravel source
  -> AAT / RouteDeclarationAst
  -> RouteBindingAstAdapter
  -> RouteBindingFact
  -> RouteBindingSemanticResolver
  -> RouteBindingContract (ADT)
  -> RouteSemanticFlow
  -> interface / consumer
```

`RouteBindingContractResolver` is now AST-free. It accepts only extracted
facts and delegates semantic interpretation to the semantic resolver.

This prevents the compatibility bridge from becoming a hidden AST-to-interface
path. `RouteProducer` and `RouteAst` remain upstream construction artifacts.

The downstream flow remains a dumb composition boundary: it receives semantic
contracts and performs no Laravel inference.

## Laravel semantic basis

Laravel 13 documents implicit model binding, custom binding keys, scoped and
without-scoped bindings, explicit model binding, and custom binding resolution.
Those decisions belong in the upstream semantic layer, not the flow.
