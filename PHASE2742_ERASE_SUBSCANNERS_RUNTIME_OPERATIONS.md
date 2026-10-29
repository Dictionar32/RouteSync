# Phase 2742 — Erase Subscanners; Fully Typed AST/ADT Runtime Operations

## Outcome

The legacy directory `packages/core/src/compiler/scanner/subscanners/` has been removed. Its 83 files (78 TypeScript files and 5 other files) were relocated under `packages/core/src/compiler/scanner/operations/`; production imports, tests, and audit scripts were updated to the new path. There are no production/test/script imports pointing to the retired directory.

The relocation was paired with a public API cutover:

- 26 exported `function` declarations were converted to internal implementation functions and 8 interface-typed frozen operation objects.
- 10 exported `const` arrow-function APIs were converted to internal function values and 8 interface-typed frozen operation objects.
- The resulting 16 operation objects use `export const name: Interface = Object.freeze({...})`.
- Scanner operation modules no longer contain exported free-function declarations or exported callable `const` function expressions.
- Runtime callers and tests were updated to call operation properties, including the controller AST, DTO, middleware, service, provider, model-column and invalidation paths.

## Runtime trace: CLI → upstream → manifest

```text
CLI scan / sync
  → composition.manifestScanOperation.scan(input)
  → routeSyncCliUpstreamCompositionFactory
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → controller invocation manifest composition authority
  → upstreamManifestBuilder.manifestBuilderOperationPreparation.prepare(input)
  → laravelSourceAstPipelineFactory.create(
      laravelSourceAstPipelineDependencies,
      pipelineInput
    )
  → interface-first runtime scanner operations
      ├─ migrationAstScanningOperation.scan
      ├─ dtoDeclarationInventoryScanningOperation.scanInventory
      ├─ serviceAstScanningOperation.scanBundle
      ├─ middlewareAstScanningOperation.scan
      ├─ providerAstScanningOperation.scanBundle
      └─ laravelResponseScanner
  → AST/artifact + semantic judgment projection
  → manifest_builder_complete | manifest_builder_blocked
  → CLI projection / generation
```

CLI `scan` and `sync` still consume the same manifest scan operation created at the upstream composition root. Scanner relocation does not take manifest ownership away from the manifest builder. The complete/blocked manifest ADT remains explicit.

## Architectural boundaries

- `packages/core/src/compiler/scanner/subscanners/` is absent.
- `packages/core/src/compiler/scanner/operations/` now owns the relocated scanner operation modules; no parallel compatibility directory was left behind.
- `packages/core/src/semantic/relations/` remains present and empty (0 files).
- `packages/core/src/semantic/foundation/` remains present and empty (0 files).
- `relationFoundation` has zero references in `packages/core/src`.
- No relation/foundation replacement module, wrapper, or abstraction was introduced. Existing unresolved imports remain visible rather than being masked.

The type-only `laravelSubscannerRetirementInterface.ts` retains a historical `legacyDirectory` literal for the deleted path; it is not an import or a runtime dependency.

## Audit and validation

Run:

```bash
npm run audit:phase2742-erase-subscanners-runtime-operations
```

The static audit passes **16/16 checks**, including directory removal, operation-object contracts, zero free-function exports, updated runtime wiring, CLI shared manifest operation, preserved complete/blocked ADT, and empty relations/foundation directories.

Syntax-only TypeScript transpilation passed for 2,349 TypeScript/TSX files with 0 syntax errors. This is not a full typecheck. `node_modules` is absent, and the globally available TypeScript 5.8 compiler does not support the repository's configured `ES2025` target; the full project typecheck, unit tests, build, and CLI end-to-end suite were not verified. In addition, imports into the intentionally empty semantic relations/foundation areas can still fail. These errors have not been hidden or replaced with new abstractions.

## Artifacts

- `reports/PHASE2742_ERASE_SUBSCANNERS_RUNTIME_OPERATIONS_AUDIT.json`
- `reports/PHASE2742_SCANNER_OPERATION_RELOCATION_INVENTORY.json`
