# Phase 113 — Interface Trace & Repair Against ecommerce_shop Source

## Source corpus

The RouteSync interface was checked against the actual Laravel source at:
`/mnt/data/ecommerce_actual/ecommerce_shop-main`.

Representative source contracts used for the repair:

- `app/Http/Controllers/Auth/AuthController.php`
  - `register()` returns `success`, `message`, `data: null`.
  - `login()` returns nested `data.token` and `data.user` fields.
- `app/Http/Resources/OrderResource.php`
  - model properties, nullsafe relation access, null-coalescing fallback, nested `promotion` and `shipping` objects, `OrderDetailResource::collection()`.
- `app/Http/Resources/PaymentResource.php`
  - nested order/promotion/payment-detail/gateway paths and conditional array access.
- `app/Http/Resources/ProdukItemResource.php`
  - `frontend -> gambar`, `category -> nama`, numeric casts and computed image URL.
- `app/Http/Resources/OrderDetailResource.php`
  - `produkItem -> frontend -> gambar` and computed subtotal.
- `app/Http/Controllers/PromoController.php`
  - query chains, `latest()->first()`, relation loading, computed discount values.

## Interface repairs

1. `ResourceFieldDescriptor` now has one public semantic boundary:
   `semantic: ResourceFieldSemantic`.
2. `ScannedResourceFieldParams` now carries the same canonical semantic object.
3. `ResourceFieldSemantic` is a closed ADT:
   - `verified` carries the semantic type and verified bound node.
   - `rejected` carries only the explicit bound rejection reason.
4. Legacy `semanticType` and `boundAst` accessors are derived views only. They do not store duplicate state.
5. `BoundStepEdge` is now a closed union separating property steps from method steps.
6. Eloquent method-chain steps preserve method name, source model, cardinality, nullsafe access, step type and target model.
7. `BoundCardinality` now preserves `paginated_collection` instead of collapsing it into `collection`.
8. The property-path binder no longer rejects every `method_chain`. Registered Eloquent transitions such as `first()` and `paginate()` are represented in the bound path.
9. Existing malformed `ScannedResourceFieldDescriptor.fromExpression()` call shapes in resource binders were normalized to the canonical argument order.

## Remaining boundary

`ObjectProperty` still reduces a bound field to `name + type + required + nullable + description` in several consumers. The next repair should preserve the bound property provenance there rather than re-derive it later.

## Verification

The focused TypeScript compilation was run with `tsconfig.phase87.33.narrow.json`.
No diagnostics were emitted for the files changed in this phase. The repository still contains unrelated pre-existing TypeScript errors elsewhere, so this is not a repository-wide green result.
