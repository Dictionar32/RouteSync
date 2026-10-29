# Phase 2737 — DTO AST Runtime Operation

## Scope

Migrate the existing DTO AST and closed DTO inventory entrypoints to one explicitly typed runtime operation object. Keep the change small: no new semantic authority, no new generic helpers, and no replacement for the intentionally empty `semantic/relations` or `semantic/foundation` directories.

## Source changes

Changed `packages/core/src/compiler/scanner/subscanners/dtoAstCanonical.ts`:

- `scanDtoAsts` is now the internal `scanDtoAstsImplementation`.
- `scanDtoDeclarationInventory` is now the internal `scanDtoDeclarationInventoryImplementation`.
- Public entrypoints are exposed through `DtoDeclarationInventoryScanningOperationInterface` and `dtoDeclarationInventoryScanningOperation`, a frozen object with explicit `scanAsts` and `scanInventory` methods.
- The existing incomplete-inventory ADT and its blocker details are preserved. `scanAsts` still rejects an incomplete inventory rather than silently turning it into an empty DTO list.

Updated production wiring in `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts` to bind `LaravelDtoDeclarationInventoryScannerInterface.scan` to `dtoDeclarationInventoryScanningOperation.scanInventory`.

Updated the three existing DTO authority tests to call the operation object rather than importing the removed free function. No new tests or semantic authorities were invented for this migration.

## Runtime trace: CLI → manifest

```text
CLI scan / sync command
  → composition.manifestScanOperation.scan(input)
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → controller invocation manifest composition authority
  → source-project identity / route selection / controller discovery
  → source-document acquisition and inventory judgments
  → manifestBuilderOperationPreparation.prepare(input).build()
  → laravelSourceAstPipelineFactory.create(dependencies, input)
  → laravelSourceAstPipelineDependencies.dtoDeclarationInventoryScanner.scan
  → dtoDeclarationInventoryScanningOperation.scanInventory(sourceProject)
  → complete DTO declaration inventory OR explicit incomplete-inventory ADT
  → source AST completion or manifest_builder_blocked
  → manifest_builder_complete | manifest_builder_blocked
  → CLI RequestType preflight and projection
  → manifest_projected | manifest_projection_blocked
```

The CLI scan and sync commands continue to consume the same `manifestScanOperation.scan(...)` runtime operation. The DTO migration does not bypass the upstream manifest authority or collapse complete/blocked outcomes.

## Audit

Run:

```bash
npm run audit:phase2737-dto-ast-runtime-operation
```

Static audit result: **13/13 checks passed**. A separate TypeScript `transpileModule` syntax pass also succeeded for the changed scanner, production wiring, and three updated test files (**5/5 files**). It checks interface-first exports, production binding, test call sites, the CLI manifest path, complete/blocked manifest outcomes, zero `relationFoundation` references in core TypeScript source, and both required empty directories.

## Verification limits

`node_modules` is absent in this workspace. The global TypeScript CLI is present, but full project typecheck, all unit tests, build, and CLI end-to-end were not verified. The audit is static and does not claim those checks passed.

## Hard constraints preserved

- `packages/core/src/semantic/relations/`: 0 files.
- `packages/core/src/semantic/foundation/`: 0 files.
- No foundation replacement, compatibility wrapper, or relocated copy was added.
- Existing errors are not hidden by introducing fallback behavior.
