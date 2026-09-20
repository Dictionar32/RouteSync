# Phase 178 — Trace AST/ADT Interface

## Focus
Relation-load batch resolution: downstream was scanning parsed target resolutions with `find()` and an `undefined`-like invalid state, then reclassifying the batch.

## Trace
`ResourceRelationLoadLexemes.targets` → `parseResourceRelationLoadTarget[]` → consumer searched for invalid target → either throw/unreachable or construct valid targets.

## Interface elevation
Added `ResourceRelationLoadBatchResolution`:

- `resolved { targets }`
- `invalid { reason: 'invalid_target' }`

Added `matchResourceRelationLoadBatchResolution()`.

`relationLoadTargets()` now consumes the semantic batch resolution rather than searching the raw resolution array itself.

## Result
Flow is now:

`raw relation-load expression → lexeme ADT → target resolution → batch resolution → ResourceRelationLoadArguments → downstream`

The downstream operation no longer determines whether any target failed by scanning the collection.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only pre-existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto'`

No new TypeScript errors were introduced by Phase 178.

## Next trace target
Grouping/property collection still contains an explicit `property.kind !== 'resolved'` branch after matcher resolution. Elevate the collection into a semantic `ResourcePropertyBatchResolution` so the consumer receives either complete properties or a typed invalid reason without re-checking the child resolution.
