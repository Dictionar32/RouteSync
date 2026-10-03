# Phase 568 — Build Trace: SymbolTable Relation Refinement

## Trace source

`build(4).log` shows ESM/CJS builds succeeding, while DTS fails only in `packages/core/src/semantic/SymbolTable.ts`.

## Root causes

1. `relationSelect` accepted only a boolean predicate, so type-guard predicates did not preserve the `ModelSemanticRelation` / `ModelSemanticAccessor` subtype selected from `ModelSemanticProperty`.
2. `relationOptionFold` inference widened several `Lookup<T>` results to `Lookup<unknown>` in `SymbolTable`.

## Repair

- Added `RelationRefinement<T, U extends T>` and overloads for `relationSelect` and `relationFirstOption`, preserving declarative relation filtering while retaining TypeScript narrowing.
- Added explicit result types to the `relationOptionFold` calls in `SymbolTable`.
- No semantic fallback or imperative traversal was introduced.

## Verification

- Project TypeScript invocation was attempted.
- It is blocked by the checkpoint environment missing `@types/node` and `vitest/globals`; this is an environment dependency failure, not a reported SymbolTable error.
- The filtered TypeScript trace contains no remaining `SymbolTable` or `relationalSequence` diagnostics.
