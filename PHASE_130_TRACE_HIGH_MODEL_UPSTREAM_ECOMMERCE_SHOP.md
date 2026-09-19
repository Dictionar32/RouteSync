# Phase 130 - High Model Upstream Trace: ecommerce_shop

## Scope
Source `ecommerce_shop` -> upstream interface/ADT only. Downstream is intentionally untouched.

## Source evidence
- `app/Http/Controllers/OrderController.php`: `collect($items)->groupBy('produk_item_id')->map(fn($g) => array_sum(array_column($g->toArray(), 'qty')))`.
- `app/Http/Controllers/OrderController.php`: `$order->details()->sum(DB::raw('qty * harga'))`.
- `app/Http/Controllers/WishlistController.php`: `get()->pluck('produkItem')->filter()->values()`.

## Information-loss boundaries found
1. `DB::raw(...)` was represented as a generic `ResourceExpressionModel`, which mixed PHP expressions with SQL/query expressions.
2. `groupBy()` result had no first-class grouped collection state.
3. collection callback model needed an explicit parameter/input/result contract.
4. aggregate projection needed to preserve the actual numeric expression instead of only the aggregate method name.

## Repairs
- Added `resourceSqlExpression.ts` with closed numeric SQL expression ADT.
- Added `ResourceSqlRawExpressionModel` so aggregate raw SQL is no longer a generic PHP expression.
- Added `resourceCollectionGroupModel.ts` for explicit grouped collection state.
- Kept callback parameter as `VariableName`, not free `string`.
- Aggregate raw-expression projection now uses `ResourceSqlRawExpressionModel`.

## Target flow
`OrderDetail -> relation(details) -> relation_query<OrderDetail> -> aggregate(sum) -> SQL numeric expression(qty * harga) -> scalar<number>`.

`items -> literal_collection -> group_by(produk_item_id) -> grouped_collection -> map(callback) -> computed scalar`.

## Remaining upstream work
- Parse/resolve `DB::raw('qty * harga')` into `column(qty) * column(harga)` from AST/query tokens instead of accepting a source string as semantic truth.
- Resolve grouped callback `$g` to the grouped element model/value contract.
- Re-run full source trace for all 84 PHP files and remove remaining raw primitive semantic fields.
- Only after upstream is complete should DomainGraph/lowerers be changed.
