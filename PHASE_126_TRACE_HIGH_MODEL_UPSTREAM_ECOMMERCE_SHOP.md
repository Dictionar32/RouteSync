# Phase 126 — High Model Upstream Trace: ecommerce_shop

## Boundary

Source `ecommerce_shop` remains the only semantic origin. Downstream generators/lowerers are intentionally not changed.

## Observed source patterns

- Model query chains: `where`, `with`, `latest`, `orderBy`, `lockForUpdate`, `query`.
- Query terminal results: `first`, `firstOrFail`, `get`, `paginate`, `simplePaginate`, `cursorPaginate`.
- Relation query chains: `$order->details()->where(...)->first()`.
- Collection transformations: `pluck`, `filter`, `values`.
- Resource collection boundaries: `OrderResource::collection($orders)`, `ProdukItemResource::collection($items)`, `OrderDetailResource::collection($this->details)`.

## Repairs

1. Added `ResourceRelationQuerySurface` so relation invocation is distinct from ordinary model method invocation and preserves source model, relation, target model, and cardinality.
2. Added `ResourceCollectionTransformationModel` and `ResourceCollectionMethodSurface` so collection transformations are represented upstream instead of being re-derived downstream.
3. Extended method result vocabulary to retain the originating model for scalar query results.
4. Kept all new interfaces closed ADTs and semantic value objects.

## Remaining upstream boundary

`pluck('produkItem')` requires argument-aware member resolution so the result element model can be derived from the source model's relation surface. This must resolve through the model/relation registry before the response boundary is considered complete.

The next upstream repair is therefore:

`collection<Model> -> pluck(RelationName) -> collection<TargetModel> -> filter -> values -> Resource::collection`

No downstream work should begin before this boundary is closed.
