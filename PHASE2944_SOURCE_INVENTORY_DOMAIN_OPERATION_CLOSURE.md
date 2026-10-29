# Phase2944 — Source Inventory Domain Operation Closure

## Goal

Continue the Fully Explicit Simplicity Typed Runtime Scanner Operations audit along the upstream CLI manifest path. Remove an effect-only visitor contract from the existing source inventory ADT and let the domain inventory expose its already-existing ordered projection operation.

## Trace

`CLI scan/sync/drift audit` → `ControllerInvocationManifestBuilderInterface.build(input)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → controller-source discovery → `LaravelControllerSourceInventoryInterface.sources` (`SourceFileInventory`) → `SourceFileInventory.toSourceFiles()` → parallel `PhpSourceDocumentReaderInterface.read(input)` operations → read-settlement ADT → source identity binding → semantic inventory closure → `ManifestBuilderOperationPreparationInterface.prepare(input)` → `ManifestBuilderJudgment.continueWith(...)` → CLI manifest terminal `continueForDriftAudit(...)`.

## Root cause and change

`SourceFileInventory` previously exposed `visitSources(visitor): void`. Its empty terminal implemented this as a no-op, and the manifest composition used a side-effecting visitor only to append read promises into a mutable array. That is weaker than the existing `toSourceFiles(): readonly SourceFile[]` operation and leaves an unnecessary effect-only helper interface in the upstream contract.

Changes:

- Removed `SourceFileInventoryVisitorInterface` and `visitSources` from `packages/core/src/types/upstream/names.ts`.
- Kept the existing ordered `toSourceFiles()` domain operation; no replacement generic collection helper or new ADT was introduced.
- Updated manifest composition to build read settlements from `sources.toSourceFiles().map(...)` and preserve concurrency with `Promise.all`.
- Updated source inventory and route-source-selection tests to consume ordered domain projections.
- Removed the obsolete visitor type from the public core barrel.
- Preserved `packages/core/src/types/upstream/collections.ts` as an empty file.

## Interface-first runtime policy

The changed runtime path continues to use typed operation objects and existing interfaces. This phase adds no exported function declaration and does not claim repository-wide `export function` migration is complete.

## Verification

Run `npm run audit:phase2944-source-inventory-operation` for the 8 structural assertions. Syntax transpilation and unit tests are reported separately; structural checks are not a substitute for typecheck, tests, build, or CLI end-to-end validation.
