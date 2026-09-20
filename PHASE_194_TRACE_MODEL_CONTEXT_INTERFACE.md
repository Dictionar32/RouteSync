# Phase 194 — Trace Model Context Interface

## Trace

`ResourceModelResolver` resolves a `mono` model before resource fields are bound. The proof was previously weakened to `modelSymbol?: OriginModelSymbol`, forcing consumers to branch on model existence.

## Repair

The scanner semantic binding boundary now carries `OriginModelSymbol` as a required input. `bindResource()` already establishes this invariant through the `mono` branch, so field binders no longer reconstruct model availability.

Changed consumers:
- `fieldBinder.ts`
- `whenLoadedBinder.ts`
- `whenLoadedSemanticBinder.ts`
- `propertyAccessBinder.ts`
- `collectionArrayBinders.ts`
- `literalTernaryBinders.ts`

## Result

`modelSymbol` is no longer optional in the structured resource-binding path. The `whenLoaded` resolver no longer uses an existence `if`; property access no longer starts with a model-existence guard; nested binders receive the proven model context.

Remaining relation lookup optionality is a separate semantic lookup concern and must be raised to `Lookup<ModelSemanticRelation>` rather than reconstructed with ternary/fallback logic.

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only the existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`
