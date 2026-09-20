# Phase 161 — Trace AST/ADT/Interface

## Target
Elevate relation-load meaning so downstream does not decode Laravel relation-load strings with split/ternary/if/switch.

## Trace
`resourceModelMethodResolverOperation.ts` contained `relationLoadTargets()` which decoded encoded relation-load strings (`relation.path:property,property`) and directly built semantic targets. This made the resolver both decode source argument shape and consume the semantic result.

## Semantic loss / coupling
The existing `ResourceRelationLoadTarget` already represented the desired meaning:
- relation path
- selection = all/properties

The missing interface boundary was the conversion from the encoded query argument to that semantic target. The resolver therefore contained source-format parsing and downstream operation assembly together.

## Repair
1. Added `ResourceRelationLoadArguments` to `resourceQueryOperation.ts`:
   - `targets`
   - `invalid`
2. Added `parseResourceRelationLoadTarget()` to the existing query-domain vocabulary as the origin/query-boundary parser.
3. Added `relationSelection` registry inside the same semantic query module for `all` vs `properties` selection.
4. Changed `relationLoadTargets()` to return `ResourceRelationLoadArguments` instead of `undefined`/raw target arrays.
5. Relation-load and relation-filter handlers consume the semantic ADT through `matchRelationLoadArguments()`.
6. Removed `split(':')`, `split('.')`, and `split(',')` from `resourceModelMethodResolverOperation.ts`.

## Result
Before:
`raw expression -> resolver parses encoding -> resolver decides meaning -> operation`

After:
`raw expression -> query semantic boundary -> ResourceRelationLoadArguments -> operation -> downstream`

The downstream resolver no longer needs to understand the encoded source representation.

## Ternary / if / switch rule
A small conditional remains inside the query-origin parser because it decodes the source representation into the closed semantic ADT. This is boundary decoding, not downstream re-classification. The consumer receives `ResourceRelationLoadTarget` and does not inspect the encoded string.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only the pre-existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 161.
