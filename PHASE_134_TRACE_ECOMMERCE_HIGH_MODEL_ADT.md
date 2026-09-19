# Phase 134 — ecommerce_shop high-model upstream ADT trace

## Flow

`ecommerce_shop → PHP AST → canonical ADT/AST → complete data → Manifest → downstream`

## Source evidence

The source uses request accessors (`get`, `input`, `query`, `string`, `integer`, `boolean`, `filled`, `only`, `safe`, `user`, `validate`, `validated`, `all`, `token`), collection operations (`isEmpty`, `toArray`), Eloquent static operations (`all`, `query`, `where`, `whereKey`, `findOrFail`, `with`, `create`, `updateOrCreate`, `firstOrCreate`), `lockForUpdate`, `DB::raw`, `Rule::unique`, `instanceof`, resource construction, closures with captures, and string concatenation.

## Interface repair

The high-level expression vocabulary now contains:

- `RequestOperation` with structured request arguments.
- `CollectionOperation` for `is_empty` and `to_array`.
- `ModelStaticOperation` for model-level query/persistence semantics.
- `StaticMethodAction.model` to carry model static semantics without putting operation data into the receiver.
- `QueryOperation.first_or_create`, `update_or_insert`, and `lock_for_update`.
- `AggregateOperand.sql` for aggregate expressions backed by structured SQL AST.
- `Closure.captures` preserving `use (...)` semantics.
- `BinaryOperator.concat` preserving PHP string concatenation.

## Boundary rule

No downstream fallback is added. If scanner data cannot construct a canonical ADT variant, the source remains incomplete and must fail the upstream completeness boundary rather than silently degrading into a generic/free value.

## Verification

Canonical upstream typecheck passes. Every file in `packages/core/src/types/upstream` remains at or below 100 lines. The canonical upstream tree contains no `if`, `switch`, `null`, `undefined`, `unknown`, `any`, optional chaining, null-coalescing operator, or `Record<` token.
