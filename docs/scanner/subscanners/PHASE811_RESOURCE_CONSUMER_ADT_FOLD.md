# Phase 811 — Resource consumer ADT fold frontier

## Trace

The Phase 810 build left only `ResourceScanner.ts`. The resource and keyed-entry `relationVariantFold` calls had their branch polarity reversed. The canonical contract is `absentBranch(rest)` followed by `presentBranch(variant)`.

## Model correction

- `PhpAstValue.resource_single/resource_collection` is narrowed only through the canonical relation variant algebra.
- `PhpArrayEntry.keyed` is narrowed before its key is consumed.
- model resolution consumes canonical `OriginModelSymbol.name`.
- no compatibility descriptor, cast, or host fallback was introduced.

## Verification

`audit-phase811-resource-consumer-adt-fold.cjs` reports `allPass: true`.

The source-only checkpoint excludes `node_modules` and `dist`; local verification is `npm run build` after applying it.
