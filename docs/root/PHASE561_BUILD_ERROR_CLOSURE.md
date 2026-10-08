# Phase 561 — Build Error Closure / Canonical Import Surface

## Source of truth

The supplied build log `Teks yang ditempel (1)(7).txt` is the authoritative input for this phase.

## Traced build failures

1. `packages/core/src/semantic/kernel/index.ts`
   - duplicate exports: `requirement`, `exclusion`, `dependency`, `candidateAdmissible`.
   - `relationOptionFold` was implemented by `relationalSequence.ts` but was not exported by the kernel barrel.
   - Repair: keep `semanticDecisionEngine` as the canonical authority for decision facts and export `candidateAdmissible`, `requirement`, `exclusion`, and `dependency` once; remove compatibility-facade re-exports and the duplicate control-topology export. Expose the existing relational option primitives through the barrel.

2. `packages/core/src/types/upstream/collections.ts`
   - `matchSourceDiscovery` and `matchDiscovered` were each declared twice.
   - Repair: retain the first canonical relation-based implementation and remove the duplicate migration copy.

3. `packages/core/src/compiler/result/index.ts`
   - stale `./Result` import pointed to a non-existent file.
   - Canonical file is `./CompilationResult.ts`.
   - Repair: both `CompilationStatistics` and `CompilationResult` now export from `./CompilationResult`.

4. `packages/core/src/compiler/query/salsa/cycleDetector.ts`
   - stale `./queryTypes` import pointed to a non-existent file.
   - Canonical definitions are in `./salsaTypes.ts` and `createQueryKey` is in `./queryKeyFactory.ts`.
   - Repair: import query types and `QueryCycleError` from `salsaTypes`, while keeping `createQueryKey` on its canonical factory module.

5. `packages/core/src/semantic/SemanticResolutionKernel.ts`
   - `relationOptionFold` export failure was a barrel-surface error, not a missing implementation.
   - `readonly ModelNode[]` was rejected by `buildResolutionContext` because the consumer still required mutable `ModelNode[]`.
   - Repair: make `buildResolutionContext` consume `readonly ModelNode[]`, matching `ResolutionContext.models` and the kernel's immutable model store.
   - The implicit `candidate` type error is expected to be downstream of the failed `relationOptionFold` import; no speculative type cast was added.

6. Vue entry
   - The log reports `packages/vue/src/index.ts` does not exist.
   - The workspace contains `core`, `sdk`, `react`, and `cli`, but no `packages/vue` package.
   - Repair: remove the non-existent Vue bundle entry and stale `./vue` package export instead of manufacturing a dummy module.

## Verification

Source-level closure checks performed:

- no duplicate `matchSourceDiscovery` / `matchDiscovered` declarations remain;
- no stale `./Result` source import remains in `compiler/result`;
- no stale `./queryTypes` source import remains outside documentation/tests;
- `relationOptionFold` is present in `relationalSequence.ts` and exported by `semantic/kernel/index.ts`;
- `buildResolutionContext` accepts `readonly ModelNode[]`;
- no `packages/vue` build entry remains because the package is absent.

A full `npm run build` could not be executed in this isolated workspace: the materialized `node_modules` tree is incomplete and has no runnable `tsup`/`tsc` binaries. An attempted dependency installation exceeded the execution transport timeout. Therefore this phase does **not** claim a successful full bundler/DTS build; it claims source-level closure of every distinct error reported by the supplied log.
