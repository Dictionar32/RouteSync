# Phase 180 — Trace AST ADT Interface

## Focus
Projection collection and projection invocation.

## Finding
`resolveProjectionInvocation()` read `operation.projections[0]` and then checked for `undefined` and `kind === 'property'`. The downstream resolver therefore reconstructed the primary projection meaning from an array.

## Elevation
`ResourceProjectionArguments` now carries a semantic resolution:
- `resolved`: complete projection list plus canonical `primary` projection
- `invalid`: `empty_projection_list`

`ResourceResolvedQueryOperation.projection` now carries a typed `primary` property projection. The mutation boundary resolves raw primary projection into either the typed projection operation or a typed projection error (`unsupported_primary_projection`).

## Result
`resolveProjectionInvocation()` consumes `operation.primary` directly. It no longer indexes the projection array or re-classifies property-vs-raw at the downstream resolver.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`
Only the pre-existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors introduced by Phase 180.
