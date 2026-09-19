# Phase 132 — High Model Upstream Interface Repair

## Boundary
`ecommerce_shop` -> scanner/PHP AST -> canonical upstream ADT. Downstream lowering is not changed.

## Trace
The source contains request operations (`get`, `input`, `user`, `validate`, `validated`, `safe`, `only`, `query`, `string`, `integer`, `boolean`, `filled`, `token`, `all`), collection operations (`isEmpty`, `toArray`), `array_filter`, string helpers, concatenation, `updateOrInsert`, `DB::raw`, `Rule::unique`, and closures with captured variables.

## Repairs
- `MethodOperation` now distinguishes query, collection, request, resource, and domain semantics.
- `Closure` now preserves capture mode (`by_value` / `by_reference`) instead of dropping closure captures.
- `BinaryOperator` now includes `concat`.
- `BuiltinFunction` now covers the traced array/string helpers.
- Query vocabulary now includes `update_or_insert`.
- Aggregate operands distinguish a property from a structured SQL expression.
- `Expression` can carry a structured `SqlExpression` rather than an opaque SQL string.
- Static method actions distinguish database raw SQL, validation uniqueness, string UUID, and domain actions.

## Verification
Canonical upstream typecheck passes. All canonical upstream files remain <=100 lines. Forbidden canonical tokens (`any`, `unknown`, `null`, `undefined`, `?.`, `??`, `if`, `switch`, `Record<`) are absent.

## Remaining blocker
The scanner still emits legacy `Parsed*` models. There is no production import from the scanner into `types/upstream`. Therefore the next repair must wire the actual `ecommerce_shop` scanner boundary into `SourceAst` without reconstructing semantics in downstream passes.
