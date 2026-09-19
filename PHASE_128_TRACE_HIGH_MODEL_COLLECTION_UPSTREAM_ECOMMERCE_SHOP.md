# Phase 128 — Trace High-Model Collection Upstream

## Source boundary

Ground truth scanned from `ecommerce_shop`:

- `app/Http/Controllers/WishlistController.php`: `Wishlist::where(...)->with(...)->latest()->get()->pluck('produkItem')->filter()->values()` then `ProdukItemResource::collection($items)`.
- `app/Http/Controllers/OrderController.php`: `collect($items)->groupBy('produk_item_id')->map(fn($g) => array_sum(array_column($g->toArray(), 'qty')))`.
- `app/Http/Controllers/OrderController.php`: `$order->details()->where('produk_item_id', ...)->first()`.
- `app/Http/Controllers/ProductReviewController.php`: query ending in `paginate($perPage)`.

## Information-loss findings

1. Collection transformations were modeled too narrowly. `groupBy` and `map` were absent even though they occur in source.
2. `filter()` and `values()` must preserve element semantics, not merely method names.
3. `pluck()` has two different upstream meanings: query-builder projection and collection member projection. They must not share one scalar result state.
4. Query `pluck()` produces a value collection, not a scalar.
5. Scalar query results need a semantic type. A model name is not a scalar type.
6. Relation cardinality must survive collection projection: `one` and `many` have different resulting semantics.
7. `whereKey()` is present in source and was missing from the query-method vocabulary.
8. `collect($items)` creates a value/literal collection source; this is distinct from an Eloquent model collection.

## Repairs

- `resourceCollectionTransformation.ts`
  - added `literal_collection` and richer element semantic ADT.
  - added `group_by` and `map` transformation variants.
  - made `filter` and `values` state-preserving operations.
  - preserved relation cardinality.
  - added callback semantic state instead of dropping the callback boundary.
- `resourceCollectionMethodSurface.ts`
  - added `groupBy` and `map`.
  - removed the old free `ResourceCollectionMethodKind` string classification as the primary model.
- `resourceModelMethodSurface.ts`
  - separated query `pluck()` into `value_collection`.
  - scalar result now carries `SemanticType`.
  - added `whereKey`.
  - added dedicated `resolveResourceQueryProjection()` so a projection property is required instead of inventing a placeholder name.
- `resourceCollectionSurfaceResolver.ts`
  - relation/property projection resolves through `ResourceModelSurface`.
  - relation cardinality is preserved in the resulting element semantic.

## Remaining upstream boundary

`map()` callback semantics still require a dedicated high-level callback analyzer for closures/arrow functions. The source example computes `qty` through `array_sum(array_column(...))`; it must be represented as a semantic computation model before downstream consumption. No downstream repair should start before this boundary is complete.
