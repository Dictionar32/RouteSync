# Phase 2735 — Migration AST Runtime Operation and Upstream CLI Manifest Trace

## Intent

This phase makes the migration AST scanner's runtime entrypoint interface-first and checks the real CLI-to-manifest path. It does not move relation/foundation contents elsewhere.

## Runtime change

File: `packages/core/src/compiler/scanner/subscanners/migrationAstCanonical.ts`

- Replaced exported `async function scanMigrationAsts(...)` with internal `scanMigrationAstsImplementation`.
- Added the explicit `MigrationAstScanningOperationInterface` contract.
- Exported `migrationAstScanningOperation` as a frozen object with the typed `scan` operation.
- Updated `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts` to pass `migrationAstScanningOperation.scan` into the existing migration scanner contract.

The operation remains concrete and simple; no generic helper or compatibility wrapper was introduced.

## Required empty directories

- `packages/core/src/semantic/relations/`: 0 files.
- `packages/core/src/semantic/foundation/`: 0 files.

No source from either directory was moved into another directory, and no replacement foundation was created. Imports that still refer to deleted modules may fail; that is intentionally not hidden or patched around in this phase.

## Upstream CLI → manifest trace

```text
packages/cli/src/commands/scan.ts
  → manifestScanOperation.scan(input)
  → operation composed by packages/cli/src/upstreamCompositionFactory.ts
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → packages/cli/src/manifestScanOperationInterface.ts
  → authority.compose(input)
  → controller invocation manifest composition
  → upstream manifest builder
  → manifest_builder_complete | manifest_builder_blocked
  → scan command's request-resolution preflight and manifest projection
```

The `sync` command uses the same `manifestScanOperation.scan(...)` runtime operation. The manifest builder's `complete` and `blocked` outcomes remain distinct ADT variants. This phase does not replace the manifest authority or bypass inventory validation.

## Static audit

Run:

```sh
npm run audit:phase2735-migration-ast-runtime-operation
```

Result: **11/11 static checks passed**. Checks cover the two empty directories, the interface-first migration scanner operation, its production wiring consumer, the CLI manifest operation factory, both CLI commands, and the manifest builder's complete/blocked variants.

The audit also found **0 `relationFoundation` references in `packages/core/src`** across 1,925 TypeScript files.

## Verification limits

This is a static source audit. Full project typecheck, unit tests, build, and CLI end-to-end execution have not been verified. Because `relations/` and `foundation/` must remain empty, unresolved imports from deleted modules are allowed to surface as errors rather than being hidden with replacements.

## TypeScript references

- TypeScript object types: https://www.typescriptlang.org/docs/handbook/2/objects.html
- TypeScript interfaces: https://www.typescriptlang.org/docs/handbook/interfaces.html
- TypeScript discriminated unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
