# Phase 183 — Trace AST/ADT Interface

## Focus
Elevate model-property lookup so absence is semantic ADT data, not `undefined`.

## Trace
`OriginModelSymbol.resolveProperty()` previously returned `ResolvedPropertyBinding | undefined`.
Consumers had to infer `undefined` as `missing_property`.

## Change
The existing `Lookup<T>` vocabulary is now used:

- `found(value: ResolvedPropertyBinding)`
- `missing`

No parallel property interface was introduced.

`propertyAccessBinder.ts` and `propertyPathResolution.ts` now consume the Lookup shape.

## Architectural result

Before:

`model property -> binding | undefined -> downstream interprets undefined`

After:

`model property -> Lookup<ResolvedPropertyBinding> -> found/missing meaning`

The semantic distinction survives the boundary.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only the pre-existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 183.
