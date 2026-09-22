# Phase 181 — Trace / Suggest / Fix / Trace: Projection Primary Meaning

## Focus
Raise projection primary semantics so downstream never re-classifies a primary projection as property/raw.

## Trace finding
`ResourceProjectionArguments` previously exposed `primary: ResourceQueryProjection`, forcing `mutationHandlers.projection` to match the primary again and produce `unsupported_primary_projection` downstream.

## Interface elevation
`ResourceProjectionArguments` now carries:
- resolved: `primary: Extract<ResourceQueryProjection, { kind: 'property' }>`
- invalid: `empty_projection_list | unsupported_primary_projection`

The origin/query boundary `projectionArguments()` now resolves the primary projection once. A raw primary becomes the typed invalid reason `unsupported_primary_projection` before the operation reaches downstream.

## Downstream result
`mutationHandlers.projection` now consumes `value.primary` directly. It no longer calls `matchResourceQueryProjection` and does not re-classify primary projection kind.

## Principle
Syntax/shape interpretation happens at the origin boundary. Downstream receives semantic meaning directly.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only the pre-existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 181.
