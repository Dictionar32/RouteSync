# Phase 156 — Trace → Suggest → Fix → Retrace

## Goal
Raise `ResourceModelMethodMeaning` into a complete method-result semantic projection so downstream traversal does not reconstruct meaning with `switch`, ternary, or non-null assertions.

## Trace
`resourceModelMethodResolver.ts` contained:
- `elementType!` when constructing collection traversal projections.
- a `switch (meaning.kind)` to reconstruct `ResourceMethodResult`.
- ternary branches inside collection result construction.
- scalar result type selected by a ternary.

The strongest semantic problem was `elementType!`: the result interface was not being constructed as a total semantic value.

## Suggestion
1. Make collection element type mandatory at construction.
2. Centralize ADT dispatch in `matchResourceModelMethodMeaning` at the semantic boundary.
3. Replace scalar type inference with an explicit operation → semantic-type registry.
4. Split model-collection and paginated-collection constructors so no ternary is required to reconstruct their meaning.

## Fix
### `resourceModelMethodMeaning.ts`
Added `ResourceModelMethodMeaningVisitor` and `matchResourceModelMethodMeaning`.
The closed method-meaning ADT is now decoded once at its algebra boundary.

### `resourceModelMethodResolver.ts`
- Removed `elementType!`.
- Removed the local `switch (meaning.kind)`.
- Added semantic result constructors for query, single model, model collection, paginated collection, and scalar.
- Scalar operation → semantic type uses an explicit total registry.
- Collection and paginated collection now each construct a complete traversal projection directly.

## Result
Before:
`method meaning → downstream switch/ternary → infer traversal meaning`

After:
`method meaning → ADT matcher → complete ResourceMethodResult → traversal reads meaning`

Collection result now guarantees:
- `elementType`
- `semanticType`
- `target`
- `cardinality`
- `next`

No non-null assertion is required.

## Retrace
`rg` confirms no `elementType!` and no `switch`/ternary dispatch remains in `resourceModelMethodResolver.ts` for method-result classification.

Remaining semantic-boundary candidates are projection invocation inputs:
- `arguments_[0]` is optional.
- `surface` is optional.
- property extraction still uses a conditional expression.

These are the next interface-elevation target because a projection method should receive a complete projection argument meaning rather than rediscovering it from an optional raw expression.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: no new errors from Phase 156. Existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`
