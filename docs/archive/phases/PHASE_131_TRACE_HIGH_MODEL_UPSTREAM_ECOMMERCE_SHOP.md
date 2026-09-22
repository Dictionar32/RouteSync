# Phase 131 - High Model Upstream Trace: ecommerce_shop

## Boundary
Source `ecommerce_shop` -> PHP AST -> upstream domain ADT. Downstream is intentionally untouched.

## Source evidence
The actual source contains:
- `OrderController`: `collect($items)->groupBy('produk_item_id')->map(...)`
- `OrderController`: `$order->details()->sum(DB::raw('qty * harga'))`
- `ProductReviewController`: `->latest()->paginate($perPage)`
- `WishlistController`: `->pluck('produkItem')->filter()->values()`
- multiple `Model::where(...)->latest()->first()` flows

## Repairs
1. Added `resourceSqlExpressionParser.ts` so `DB::raw('qty * harga')` has a closed numeric expression model rather than an opaque SQL string.
2. `ResourceSqlRawExpressionModel.source` is now an explicit `sql_source` provenance value, separated from semantic expression data.
3. Added `resourceAggregateResolver.ts` to resolve aggregate projections against `ResourceModelSurface` and produce a semantic result instead of an unconditional unknown primitive for supported numeric raw expressions.
4. Existing collection group/callback ADTs remain the canonical upstream boundary for `groupBy` and `map`.

## Resulting high-level flow
`Order -> relation(details) -> relation_query<OrderDetail> -> sum -> numeric SQL expression(qty * harga) -> number`.

`items -> grouped_collection<Item> -> callback<ItemGroup> -> computed number` remains explicit.

## Remaining upstream gaps
- SQL expression parser currently covers the numeric expression subset needed by the traced `DB::raw` source. Unsupported SQL must remain rejected, not guessed.
- Aggregate property resolution should be wired into the aggregate producer so projection semantic type is produced at construction time.
- Full 84-file source trace is still required for remaining free primitives and hidden nullable/fallback states.
- `ResourceModelMethodSurface` still uses runtime string registries internally. These should eventually be replaced by a closed method semantic registry/value-object construction at the scanner boundary.

## Verification
The modified files should be checked with the narrow TypeScript configuration. Repository-wide green status is not claimed.
