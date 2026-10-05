# Phase 925 — Structural Semantic Graph Projection

Phase 925 makes the upstream `SemanticRelationGraph` the structural source for
service-graph edge derivation.

## Boundary

```text
CompleteLaravelSourceModel
  -> SemanticRelationGraph
       -> StructuralSemanticRelation
            -> projectStructuralSemanticRelationToGraphEdge()
                 -> GraphEdgeRelationSink
                 -> ServiceGraph
```

`ControllerActionPolicyRelation` remains outside this lane. The projection
function accepts `StructuralSemanticRelation`, so Laravel middleware and
authorization relations cannot be projected as graph edges through this
authority.

## Structural relations elevated

The canonical relation graph now includes `model_relation` in addition to the
existing resource/controller structural relations. Graph projection handles:

- `controller_dependency`
- `controller_resource`
- `controller_model` when its origin is a concrete model class
- `resource_model`
- `model_relation`

Relations such as route/request/response wiring are structural semantics but are
not service-graph edges, so they produce a closed `not_projectable` judgment.
A controller model relation whose origin is only a database table is likewise
not fabricated into a model node.

## Laravel / dataflow alignment

Laravel controller middleware and `Authorize` remain policy semantics. Laravel's
current controller contract supports class/method middleware, `only`/`except`,
and authorization attributes; these should remain in the policy lane until an
analysis explicitly consumes them. Generic dataflow remains value-flow
semantics rather than policy vocabulary.

## E-commerce corpus

The historical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` trees remain
absent; the maintained e-commerce regression corpus is under `packages/sdk/tests/fixtures/ecommerce-shop-source`. Existing inline Laravel e-commerce tests remain the regression corpus;
path strings in those tests are source provenance labels.
