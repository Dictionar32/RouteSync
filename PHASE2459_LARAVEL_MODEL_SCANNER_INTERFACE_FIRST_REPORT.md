# RouteSync Phase 2459 — Laravel Model Scanner Interface-First Migration

## Scope

This phase takes the existing `LaravelModelScannerInterface` contract as the sole model scanner boundary and removes the legacy `subscanners/ModelScanner.ts` entrypoint. It does not introduce a duplicate interface or claim that all model parsing internals are already migrated.

## Changes

- Moved the model scan operation owner to `packages/core/src/compiler/scanner/laravelModelScanner.ts`.
- Exported `laravelModelScanner` as an explicitly typed `LaravelModelScannerInterface` operation (`export const name: ExistingInterface = Object.freeze(...)`).
- Wired `LaravelSourceAstPipelineDependenciesInterface.modelScanner` directly to that operation; removed the composition wrapper that called `ModelScanner.scanCanonicalBundle`.
- Retired `packages/core/src/compiler/scanner/subscanners/ModelScanner.ts` and removed its barrel export.
- Moved shared source-file acquisition into `packages/core/src/compiler/scanner/sourceFiles.ts`; updated existing consumers and removed `subscanners/scannerUtils.ts` and its barrel export.
- Replaced `relationAsyncFold`/`relationProject` in the model scan orchestration with native ordered `Promise.all`/`map` projection. No `semantic/relations` or `semantic/foundation` imports remain in `laravelModelScanner.ts` or `sourceFiles.ts`.
- Updated the Phase2458 audit to recognize the now-direct interface implementation rather than requiring the retired adapter.

## Verification

- Phase2459 model scanner audit: **11/11 passed**.
- Phase2458 composition boundary audit: **7/7 passed**.
- Phase2457 resource evidence audit: **6/6 passed**.
- Phase2456 existing-contract reuse audit: **7/7 passed**.
- Phase2454 route dependency closure audit: **11/11 passed**.
- Phase2453 prepared executor audit: **9/9 passed**.
- Phase2452 scoped authority audit: **7/7 passed**, with the same 3 previously documented architecture debts still open.
- TypeScript syntax transpilation for 15 changed TypeScript files: **15/15 passed**.
- Package JSON parse and audit-script syntax checks passed.

## Explicitly Open — Not Claimed Complete

The model operation still consumes parsing/production helpers under `compiler/scanner/subscanners/model` and `subscanners/modelProducer`. A trace found direct `semantic/relations` imports in 13 model helper files; no direct `semantic/foundation` import was found in that scanned model-helper subset. These are real remaining ownership debts, not solved by the entrypoint migration. The next vertical slice must migrate those helper operations to the proper scanner owner and replace each relation utility according to its actual semantics, with regression tests; do not perform a blind textual replacement.

Other subscanner implementations remain active, including Form Request and Channel scanning. Full typecheck, Vitest, package build, and end-to-end CLI were not run because this workspace has no local `node_modules`; syntax transpilation and scoped audits are not substitutes for those checks.
