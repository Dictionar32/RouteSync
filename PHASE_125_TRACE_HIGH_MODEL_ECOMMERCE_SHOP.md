# Phase 125 - High Model Upstream Trace: ecommerce_shop

## Boundary

`ecommerce_shop source -> PHP AST -> ResourceExpressionModel -> ResourceBindingModel -> ResourceTraversalModel -> Eloquent model/method surface -> response flow model`

Downstream generators/lowerers are intentionally not changed.

## Source facts traced

The actual ecommerce_shop source contains these relevant flows:

- `ProdukController@index`: `ProdukItem::query()->with(...)->where(...)->...->get()` then `ProdukItemResource::collection($produk)`.
- `ProductReviewController@index`: `ProductReview::where(...)->...->first()` and another `ProductReview::where(...)->with(...)->latest()->paginate($perPage)`.
- `OrderController@index`: `Order::where(...)->with(...)->latest()->get()` then `OrderResource::collection($orders)`.
- `WishlistController@index`: `Wishlist::where(...)->with(...)->latest()->get()->pluck('produkItem')->filter()->values()` then `ProdukItemResource::collection($items)`.
- `OrderResource`: nested resource collection plus relation/property paths such as `$this->details`, `$promotion?->promo_code`, and `$amount?->subtotal_minor`.

## Interface repair

### 1. Method invocation is now a semantic object

`ResourceMethodInvocation` preserves:

- `MethodName`
- argument `ResourceExpressionModel[]`
- semantic `ResourceMethodResult`

The method name is no longer the only information crossing the method boundary.

### 2. Query state is explicit

`ResourceQueryState` distinguishes:

- `model_instance<ModelName>`
- `query_builder<ModelName>`

This allows `query -> query_builder`, query mutations to preserve the model, and terminal methods to produce model/single/collection/paginated/scalar results.

### 3. Traversal now carries method result

A resolved method traversal step preserves the semantic result in addition to method, arguments, source model, target and cardinality.

### 4. Response transformation has its own high-level ADT

`ResourceResponseFlowModel` separates Eloquent query flow from the response transformation:

`Eloquent flow -> resource_single/resource_collection`.

Collection input explicitly distinguishes `model_collection` and `paginated_collection`.

## Remaining upstream gaps

1. Method classification still uses internal string registries. These are implementation registries, not downstream semantic data, but they should eventually become a closed `EloquentMethodKind` registry/value-object boundary.
2. `where(...)->...` chains are classified semantically, but relation receivers such as `$order->details()->first()` still need relation-aware method state rather than generic model-query state.
3. `get()->pluck()->filter()->values()` needs a collection transformation ADT so collection element identity is not lost.
4. `OrderResource::collection(...)` needs to be constructed from the actual static-call AST and linked to its input binding. The high-level response ADT now exists but is not yet the canonical producer boundary.
5. Resource property traversal still needs to consume `ResourceModelSurface` and `ResourceTraversalResolution` together, rather than leaving some consumers on legacy semantic projections.
6. Branch/version merge provenance remains an upstream concern.

## Rule for next phase

Do not modify lowerers, generators, emitters, or `DomainGraph` consumers until the five upstream gaps above are represented by closed interfaces and verified against ecommerce_shop.
