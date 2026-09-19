# Phase 129 — High Model Upstream Trace: Collection Callback and Aggregate Boundary

## Source boundary

`ecommerce_shop` remains the source of truth. Downstream generators/lowerers are intentionally not modified.

## Trace findings

1. `OrderController::syncOrderItems()` contains `collect($items)->groupBy('produk_item_id')->map(fn($g) => array_sum(array_column($g->toArray(), 'qty')))`.
2. The previous collection ADT preserved `map` but represented callback semantics too weakly. The callback now has a dedicated `ResourceCollectionCallbackModel` and `ResourceComputationSemantic`.
3. `OrderController::recalculateTotal()` contains `$order->details()->sum(DB::raw('qty * harga'))`. This is not a plain property aggregate; it is a raw query projection and needs a dedicated aggregate surface.
4. `pluck`/`groupBy`/`map` boundaries must retain source element semantics instead of collapsing to generic `collection`.

## Repairs

- Added `resourceComputationSemantic.ts`.
- Added `resourceCollectionCallbackModel.ts`.
- Collection transformation callback now references the dedicated callback model.
- Added `resourceQueryAggregateSurface.ts` for aggregate operations and raw projections.

## Remaining upstream work

- Replace remaining free function names inside computation operations with domain value objects.
- Resolve callback parameter provenance from actual `map` AST rather than only carrying a parameter name.
- Resolve `DB::raw(...)` into a closed SQL-expression ADT instead of preserving it as an opaque expression model.
- Trace all 84 PHP files again for collection, aggregate, array transformation, and callback boundaries.
- Only after these upstream boundaries are complete should downstream lowering be reconsidered.
