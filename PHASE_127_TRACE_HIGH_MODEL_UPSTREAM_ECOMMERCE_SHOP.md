# Phase 127 — High Model Upstream Trace: ecommerce_shop

## Boundary

`ecommerce_shop -> PHP AST -> ResourceExpressionModel -> ResourceBindingModel -> ResourceTraversalModel -> ResourceModelSurface -> method/relation/collection surfaces -> response flow`

## Source evidence

The ecommerce_shop source contains:

- `Wishlist::where(...)->with(...)->latest()->get()->pluck('produkItem')->filter()->values()` followed by `ProdukItemResource::collection($items)`.
- `Order::where(...)->with(...)->latest()->get()` followed by `OrderResource::collection($orders)`.
- `ProdukItem::query()->with(...)->where(...)->get()` followed by `ProdukItemResource::collection($produk)`.
- Resource expressions such as `OrderDetailResource::collection($this->details)` and `OrderDetailResource::collection($this->order?->details)`.

## Interface repair

1. `ResourceCollectionState` no longer uses a generic `unknown` element state.
2. `pluck()` is resolved against `ResourceModelSurface` before producing a collection state.
3. Relation pluck preserves `sourceModel`, `relation`, and `targetModel`.
4. Property pluck preserves `sourceModel` and `property`.
5. `ResourceCollectionTransformationModel` now stores explicit transform provenance.
6. `ResourceExpressionBindingRequirement.variable` uses `VariableName` instead of raw `string`.

## High-level invariant

A collection transformation must not invent its element model. A `pluck` target must be verified against the source model surface. A relation produces its declared target model; a scalar property remains a property semantic until a richer type resolver supplies its value type.

## Remaining upstream work

- Integrate `resolveCollectionPluck` into the scanner/binding producer so this ADT becomes the canonical producer rather than a standalone helper.
- Model `filter`, `values`, and `through` as state-preserving transformations with explicit element semantic.
- Canonically bind `Resource::collection()` to `ResourceResponseFlowModel`.
- Trace nested resource collection expressions and nullsafe relation access without collapsing provenance.
- Re-scan all 84 PHP files for raw semantic strings, optional semantic fields, and information-loss projections before downstream changes.

## Downstream status

Downstream remains intentionally untouched.
