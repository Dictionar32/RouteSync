# Phase 2772 — Upstream Runtime Collection Root Cause

## Scope

Trace the actual producer-to-consumer contract through `core/src/types/upstream`, scanner, source-model catalog, manifest lowering, and CLI-facing projection. This phase is an evidence-backed trace and audit, not a claim that the collection design has already been migrated.

## Runtime trace

`laravelSourceAstPipeline.ts` → `SourceDiscovery<T>` in `types/upstream/collections.ts` → source AST/completeness contract → `highLevelSourceModel.ts` → `SourceModelCatalog` → semantic/reference index and manifest builder → `routeManifestLowerer.ts` / `routeManifestProjectionInputs.ts` → CLI manifest.

## Root cause

There is no single collection contract on this path:

- `SourceDiscovery<T>` stores discovered values in `readonly T[]`.
- `Sequence<T>` is a recursive `empty | cons` ADT defined in `collections.ts`.
- AST aliases and `SourceModelCatalog` use `Sequence<T>` for many fields.
- `highLevelSourceModel.ts` converts discovery collections into `Sequence` through `sequenceAlgebra.fromArray`.
- `sequenceAlgebra.toArray/project/expand` expose conversion back to arrays.

Therefore removing `Discovered<T>`, renaming helper functions, or changing just one field does not solve the root cause. It leaves multiple collection representations and conversion boundaries in the canonical upstream path.

## Recommendation

1. Decide and document the canonical domain representation first. Do not mechanically replace `Sequence<T>` with `readonly T[]`, or vice versa.
2. Trace all `Sequence<T>` and `AstSequence<T>` declarations in `types/upstream`, their constructors, visitors, projections, serializers, and tests.
3. Migrate a complete vertical slice: scanner producer → upstream AST → completeness result → source model → manifest consumer. Update types and tests in the same change.
4. Keep scanner failure distinct from successful-empty discovery. A failed or unscanned category must never be silently treated as empty.
5. For exported runtime operations that genuinely represent a public object contract, use `export interface ...` plus `export const name: Interface = Object.freeze({...})`. Do not wrap tiny generic helpers in one-interface-per-helper. For ADTs, retain explicit discriminants and exhaustive handling.
6. Remove `export function` declarations only after migrating every import/call site to the operation object and verifying public API compatibility; a textual replacement alone is unsafe.

## Audit

Run `npm run audit:phase2772-upstream-runtime-collection-root-cause`. The audit verifies the presence of the competing representations and the relevant runtime boundaries. It does not prove full TypeScript semantic typecheck, all tests, package build, or CLI end-to-end correctness.
