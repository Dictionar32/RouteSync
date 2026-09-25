# Query source → producer → QueryAst trace

## Source of truth

Only `examples/ecommerce-shop-source` is used as Laravel source data. Manifest files under that directory are not used as source evidence.

## Producer path

```text
Laravel PHP source
  → PHP AST / Expression
  → QueryProducer
  → QueryOperationAst / QueryAst
```

## Gap found and fixed

`resourceUpstreamExpressionMappings.ts::methodExpression()` intentionally preserves ordinary method calls as `MethodOperation.kind = domain`. Therefore QueryProducer must own the framework-semantic recognition for Eloquent/query method names; waiting for Expression to already contain `kind = query` caused query operations to disappear at the producer boundary.

`queryProducer.ts` now recognizes the query method vocabulary directly at the producer boundary and preserves fluent chains as:

```text
QueryAst.operations: Sequence<QueryOperationAst>
```

This avoids reconstructing a single operation downstream.

## Source methods verified

The following method names were found in PHP source under `examples/ecommerce-shop-source` and are represented by QueryOperation/model-static operation variants where their argument shape is supported:

- `whereHas`
- `whereKey`
- `whereColumn`
- `where`
- `orWhere`
- `with`
- `load`
- `latest`
- `orderBy`
- `orderByDesc`
- `limit`
- `first`
- `firstOrFail`
- `findOrFail`
- `get`
- `paginate`
- `count`
- `sum`
- `exists`
- `pluck`
- `value`
- `groupBy`
- `selectRaw`
- `delete`
- `fill`
- `create`
- `update`
- `updateOrCreate`
- `firstOrCreate`
- `increment`
- `decrement`
- `save`
- `lockForUpdate`
- `updateOrInsert` is mapped as `update_or_insert` after the `DB::table(...)` database-table receiver.

## Raw SQL boundary

`selectRaw(...)` is not forced into `SqlExpression` because a raw SQL string has not been parsed into the structured SQL-expression ADT yet. It is represented as `select_raw_expression` with the original `Expression`, preserving the source datum instead of inventing structure.

## Laravel reference

Laravel 13 documents Query Builder as a fluent interface and documents `selectRaw`, where clauses, subqueries, joins, unions, aggregates, updates, upserts, locking, and related query operations. Eloquent relationships also expose query-builder chaining. See the official Laravel documentation.

## Verification limitation

The project-wide narrow TypeScript check still stops before project type checking because the workspace lacks the configured Node type definitions:

```text
TS2688: Cannot find type definition file for 'node'.
```

A separate TypeScript subset check was also attempted; it reaches pre-existing lexer typing errors before producing a clean project result. Therefore this trace records the producer correction but does not claim a green project-wide compile.
