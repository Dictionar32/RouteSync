# Phase 2738 — Fully Typed AST / ADT Response Scanner Runtime Operation

## Scope

The response scanner's exported free-function entrypoints have been removed from the runtime module. The source implementation is now internal and the public runtime surface is an explicitly typed, frozen operation object.

## Source change

File: `packages/core/src/compiler/scanner/subscanners/responseScanner.ts`

- `scanResponseBundle(...)` → internal `scanResponseBundleImplementation(input: LaravelResponseScannerInput)`.
- `scanResponseAsts(...)` → internal `scanResponseAstsImplementation(input: LaravelResponseScannerInput)`.
- Added `LaravelResponseScannerOperationsInterface extends LaravelResponseScannerInterface`, with typed `scanBundle` and `scanAsts` operations.
- Public runtime value is `export const laravelResponseScanner: LaravelResponseScannerOperationsInterface = Object.freeze({...})`.
- The source-AST pipeline continues to use the upstream `scan` contract; no second semantic authority was added.
- Projection still derives from controller response judgments. Unresolved, blocked, rejected, and return-semantic-only judgments do not fabricate `ResponseAst` values.

## Upstream CLI → manifest trace

```text
CLI scan / sync
  → shared manifestScanOperation.scan(...)
  → routeSyncCliManifestScanOperationFactory / upstream composition
  → manifest composition authority
  → source-project identity, route selection, discovery and inventory
  → manifest builder preparation and source-AST pipeline
  → laravelSourceAstPipelineDependencies injects laravelResponseScanner
  → laravelSourceAstPipeline invokes responseScanner.scan(input)
  → internal response DTO scan + controller-response projection judgments
  → response definitions + ResponseAst products + projectionJudgments
  → manifest builder complete | blocked
  → manifest projection complete | blocked
```

The response operation remains inside the production runtime dependency path. This phase does not alter CLI manifest ownership or collapse ADT judgments to booleans/empty success values.

## Audit

Command: `npm run audit:phase2738-response-scanner-runtime-operation`

Static audit: **13/13 checks passed**.

Verified:
- `packages/core/src/semantic/relations/` exists and has zero files.
- `packages/core/src/semantic/foundation/` exists and has zero files.
- no `relationFoundation` references remain under `packages/core/src`.
- response bundle and AST entrypoints are no longer exported free functions.
- runtime operations have explicit input/output types and are exposed by `Object.freeze`.
- production pipeline uses the injected scanner operation.
- CLI scan/sync retain the shared manifest scan operation and manifest builder complete/blocked ADT outcomes.

The audit is static source verification. Full project typecheck, unit tests, build, and CLI end-to-end execution were not run because project dependencies (`node_modules`) are absent. No claim is made that those checks passed.
