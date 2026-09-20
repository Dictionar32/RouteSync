# Phase 30 — Response Vocabulary SSOT

## Scope
Upstream interface only.

## Trace finding
After raising `ResponseDefinition`, `highLevelContracts.ts` still contained a second response payload/shape vocabulary. That would recreate the same semantic duplication we are removing elsewhere.

## Repair
`response.ts` is now the canonical response semantic vocabulary. `highLevelContracts.ts` re-exports/adapts the canonical `ResponseJsonPayload`, `ResponseJsonShape`, and `ResponseResult` instead of defining another competing response ADT.

## Principle
One semantic concept has one canonical upstream vocabulary. High-level facades may compose it, but must not create a second meaning-equivalent ADT.
