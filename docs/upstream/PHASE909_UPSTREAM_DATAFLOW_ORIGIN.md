# Phase 909 — Upstream Dataflow Origin Boundary

Phase 909 fixes the ownership boundary exposed by Phase 908 without collapsing the two identity algebras.

## Decision

`SemanticDataFlowInterface` remains implemented beside the semantic scanner because its `KnowledgeId`, guards, and semantic facts are scanner-semantic types. It is not imported into `types/upstream`; doing so would invert the layer dependency.

The canonical upstream `AstDataflowInterface` now explicitly records its typed origin:

```text
SemanticKnowledgeDataFlow
  -> AstDataFlowAuthority adapter
  -> AstDataflowJudgment
  -> AstDataflowInterface
       origin = semantic_knowledge_data_flow
```

The origin is metadata, not a second dataflow ontology. `AstDataflowJudgment` remains the sole upstream dataflow authority.

## Why this is the safer cut

Laravel exposes middleware through declarative controller/resource interfaces and scoped exclusions; the framework semantics are resolved from those declarations rather than from a text projection. Laravel 13 documents `HasMiddleware`, method-scoped `Middleware`, inherited class-level `WithoutMiddleware`, and resource `middlewareFor` / `withoutMiddlewareFor` as first-class semantics.

For dataflow architecture, MLIR similarly separates generic interfaces from concrete implementations and lets dataflow analyses maintain their own dependency graph and transfer behavior. RouteSync therefore keeps the semantic knowledge algebra in its implementation layer while making the upstream adapter's provenance explicit.

## Non-goals

- No conversion of `KnowledgeId` into strings for authority purposes.
- No compiler/scanner import into `types/upstream`.
- No reintroduction of primitive source/target dataflow fields.
- No claim that `examples/ecomerce-shop-source` exists; current regression coverage uses the repository's existing e-commerce tests.
