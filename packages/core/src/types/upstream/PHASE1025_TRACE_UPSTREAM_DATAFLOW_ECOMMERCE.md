# Phase 1025 — Upstream/Dataflow/Ecommerce Trace

## Canonical boundary

`packages/core/src/types/upstream/dataFlowInterface.ts` remains the smallest execution algebra:

1. `seed(input)`
2. `derive(state)`
3. `close(state)`
4. `reaches(state, source, target)`

No source/sink/barrier/additional-step policy and no graph/IR projection belongs here.

## Manifest

`semanticDataflowManifestSurface.ts` assembles one controller-scoped input from:

- scanner/controller facts;
- route parameter binding facts;
- controller query facts;
- controller resource/model/response facts.

The input is intentionally mixed-producer. Therefore input-level producer lineage cannot be used for policy.

## Fact provenance

`SemanticDataflowFact.lineage` is the authoritative producer boundary. Current producer vocabulary is:

- `route`
- `controller`
- `resource`
- `model_relation` (reserved structural evidence)
- `schema` (reserved structural evidence)

`reaches` remains derived closure and carries no producer lineage.

Phase 1025 removes producer lineage from `SemanticDataflowOrigin`. Origin now identifies only the semantic input boundary. This prevents a controller-scoped input from being falsely classified as controller-originated.

## Laravel fixture

The ecommerce fixture provides concrete distinctions:

- route parameters such as `/produk/{id}`, `/orders/{id}`, `/payment/{orderId}` are route binding evidence;
- controller query predicates such as `whereHas('order', ...)` and request-derived values are controller/query evidence;
- `new OrderResource(...)`, `PaymentResource`, and `ProdukItemResource::collection(...)` are resource/response projection evidence;
- Eloquent declarations such as `belongsTo`, `hasMany`, and `hasOne` are model structural relations;
- migration foreign keys such as `orders.user_id`, `order_details.order_id`, `payments.order_id`, and `product_reviews.produk_item_id` are schema structural evidence.

Model relations and schema foreign keys must not become generic dataflow sources/sinks merely because they are available upstream. A concrete analysis must select them explicitly as additional flow evidence if its question requires that.

## Graph and IR

`ServiceGraphBuilder` consumes `DataFlowProjectionInterface` and `GraphEdgeRelationSink`; it does not run semantic dataflow closure.

`SemanticDataflowIRProjection` consumes `SemanticDataflowInterface.judgment.closure`; it does not reconstruct closure.

Thus there is one semantic closure authority and separate structural/IR projections.

## Analysis policy lane

`DataFlowFactPolicyInterface` performs fact-scoped selection. `DataFlowConfigContributorInterface` composes selected analysis policy into source/sink/additional-step/barrier predicates.

This ordering is intentional:

`semantic facts -> fact selection -> analysis policy -> solver`

not:

`producer label -> automatic source/sink -> semantic upstream solver`.

## External alignment

CodeQL models global dataflow through analysis configurations that define sources and sinks and optionally additional flow steps and barriers, while a generic solver performs the flow computation. MLIR's `DataFlowSolver` similarly orchestrates child analyses and fixed-point execution rather than embedding one analysis policy into the generic solver contract.

RouteSync therefore should continue to keep `DataFlowInterface` narrow and keep analysis policy downstream.
