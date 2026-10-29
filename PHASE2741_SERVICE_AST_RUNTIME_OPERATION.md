# Phase 2741 — Service AST ADT Runtime Scanner Operations

## Scope

Migrated the Service AST scanner public entrypoints to an interface-first operation object and updated its production dependency wiring. The change is confined to the service scanner and the actual runtime composition caller.

## Source changes

- `packages/core/src/compiler/scanner/subscanners/serviceAstCanonical.ts`
  - Replaced exported `scanServiceBundle` with internal `scanServiceBundleImplementation`.
  - Replaced exported `scanServiceAsts` with internal `scanServiceAstsImplementation`.
  - Added `ServiceAstScanningOperationInterface` with explicit input/output types.
  - Added `serviceAstScanningOperation: ServiceAstScanningOperationInterface = Object.freeze({...})`.
- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts`
  - Replaced the free-function import and call with `serviceAstScanningOperation.scanBundle(...)`.
- `scripts/audits/audit-phase2741-service-ast-runtime-operation.cjs`
  - Added static checks for the operation contract, production wiring, manifest trace, ADT outcomes, and required empty semantic directories.
- `package.json`
  - Added `audit:phase2741-service-ast-runtime-operation`.

## Upstream CLI → manifest → runtime trace

```text
CLI scan / sync
  → shared manifestScanOperation.scan(...)
  → upstream composition factory
  → manifest builder preparation and manifest builder
  → Laravel source AST pipeline factory
  → laravelSourceAstPipelineDependencies.serviceScanner
  → serviceAstScanningOperation.scanBundle(sourceProject, modelSymbolTable)
  → ServiceScanBundle.artifacts
  → service scan judgment preserving each artifact's AST + definition
  → manifest_builder_complete | manifest_builder_blocked
  → manifest projection
```

The service scanner remains a subordinate source-acquisition/scanning operation. It does not take over manifest authority. The existing `complete`/`blocked` manifest outcomes and AST-definition artifact pairing remain intact.

## Audit and verification

- Static audit: **12/12 passed**.
- `node --check` on the audit script: passed.
- `package.json` JSON parse: passed.
- TypeScript `transpileModule` syntax checks for both changed `.ts` files: passed.
- `packages/core/src/semantic/relations/`: **0 files**.
- `packages/core/src/semantic/foundation/`: **0 files**.
- `relationFoundation` references in `packages/core/src`: **0**.

## Verification boundary / known constraints

Full-project typecheck, unit tests, build, and CLI end-to-end tests were not run. This static audit must not be interpreted as a successful full compilation. The two semantic directories are intentionally kept empty as requested; imports that still target absent modules are not replaced, moved, or hidden. Such unresolved imports may therefore still cause typecheck/build failures.
