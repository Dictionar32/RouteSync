# Phase 3107 — Filesystem Failure Domain Operation

## Objective

Move filesystem-failure-to-discovery-blocker knowledge from the CLI composition root into the upstream filesystem-failure ADT. The operation is now explicit and fixed to a domain result; the CLI no longer selects failure-code and location variants through generic handler records.

## Runtime path

`fs.readdir` / `fs.realpath` rejection → `nodeFilesystemFailureObservation` normalizes platform evidence → `FilesystemFailureCode.createDiscoveryBlocker(...)` → `FilesystemFailureLocation.createMissingPathBlocker(...)` for missing paths → existing `LaravelControllerSourceDiscoveryBlocker` → blocked discovery judgment → partial inventory and blocker remain in the result → manifest preparation.

## Changed files

- `packages/core/src/types/upstream/filesystemFailureInterface.ts`
  - Removed `FilesystemFailureCodeHandlers<Result>` and `FilesystemFailureCodeOperations.continueWith<Result>`.
  - Added `createDiscoveryBlocker(input)` and `createSourceReadBlocker(sourceFile)` as named upstream domain operations.
  - Removed `FilesystemFailureLocationHandlers<Result>` and generic location continuation.
  - Added `createMissingPathBlocker(root, directory, failure)` to the location ADT; root and directory variants own the correct missing-path blocker.
- `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`
  - Replaced handler selection with `failureCode.createDiscoveryBlocker({ root, directory, location, failure })`.
- `packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts`
  - Replaced the source-read handler record with `createSourceReadBlocker(sourceFile)`, preserving the existing blocked read result contract.
- `packages/core/src/types/upstream/__tests__/filesystem-failure-adt.phase2917.test.ts`
  - Replaced generic-continuation tests with domain-operation behavior checks, including blocker evidence preservation.
- `scripts/audits/audit-phase3107-filesystem-failure-domain-operation.cjs`
  - Repeatable structural audit for the new operation and runtime delegation.

## Explicitly not claimed

This phase does not remove every primitive, control-flow construct, generic continuation, or exported function in the repository. It migrates one concrete upstream-to-CLI runtime boundary. Full repository typecheck, full test suite, and PHP → CLI → manifest → generator E2E require separate execution and are not inferred from the structural audit.

## Architecture constraint

No deleted relation foundation under `packages/core/src/semantic/relations/` is restored. The existing upstream filesystem failure and controller discovery ADTs remain the source of truth.

## Repository-wide AST frontier snapshot

The repeatable AST inventory over `packages/core/src`, `packages/cli/src`, `packages/sdk/src`, and `packages/react/src` currently records:

- 2,245 TypeScript files
- 520 exported function declarations and 459 exported arrow-valued exports (979 candidates under this inventory definition)
- 57 generic `continueWith<Result>` arrow implementations
- 2,224 `if`, 571 `switch`, 315 `for`, and 33 `while` statements
- 1,238 ternary expressions, 228 `??` expressions, 4,094 strict-equality expressions
- 814 `.map()` and 18 `.reduce()` calls
- 5,219 `string`, 1,517 `number`, 978 `boolean`, 271 `undefined`, 166 `null`, 915 `unknown`, and 423 `void` type keywords
- 8,922 array literals, 3,802 `as` expressions, 95 `lookup` identifiers, and 1,308 `visitor` identifiers

These are syntax counts, not automatically defects. They are retained as a measurable migration frontier. Primitive values remain appropriate at platform boundaries when they represent actual runtime inputs; the target is to prevent them from becoming unmodeled domain knowledge deeper in the pipeline.
