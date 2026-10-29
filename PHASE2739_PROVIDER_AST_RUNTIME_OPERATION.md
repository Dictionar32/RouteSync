# Phase 2739 — Fully Typed Provider AST / ADT Runtime Scanner Operations

## Scope

This phase continues the actual RouteSync runtime migration after Phase 2738. It converts the provider scanner's exported free-function entrypoints into an interface-typed frozen operation object and updates the production composition dependency to use that object.

## Source changes

### `packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts`

- `scanProviderBundle(...)` is now the internal `scanProviderBundleImplementation(...)`.
- `scanProviderAsts(...)` is now the internal `scanProviderAstsImplementation(...)`.
- Added `ProviderAstScanningOperationInterface` with explicit `SourceProjectIdentity` inputs and `ProviderScanBundle` / `readonly ProviderAst[]` outputs.
- Added `providerAstScanningOperation: ProviderAstScanningOperationInterface = Object.freeze({...})` exposing `scanBundle` and `scanAsts`.
- `scanProviderAstsImplementation` delegates to the internal bundle implementation; it does not call a removed public free function.

### `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts`

- Replaced the direct `scanProviderBundle` import with `providerAstScanningOperation`.
- Production provider dependency now calls `providerAstScanningOperation.scanBundle(sourceProject)`.
- Existing provider judgment still projects each artifact's `ast` and matching `definition` together. This phase does not normalize unresolved or failed outcomes into an empty-success result.

## Runtime trace: CLI → upstream manifest → provider scanner

```text
packages/cli/src/commands/scan.ts / sync.ts
  → manifestScanOperation.scan(...)
  → upstream composition / RouteSyncCliManifestScanOperationInterface
  → manifest scan operation and source-project identity
  → manifest builder preparation
  → Laravel source AST pipeline factory
  → laravelSourceAstPipelineDependencies.providerScanner.scan(...)
  → providerAstScanningOperation.scanBundle(sourceProject)
  → provider source discovery and AST/semantic producer
  → ProviderScanBundle.artifacts (AST + matching ProviderDefinition)
  → LaravelProviderScanJudgment
  → manifest builder complete | blocked
  → manifest projection complete | blocked
```

The CLI scan/sync manifest authority remains shared and unchanged. Provider scanning is still injected through the upstream provider-scanner contract; only the internal concrete entrypoint is now accessed through a named operation object.

## Audit and verification

Command:

```sh
npm run audit:phase2739-provider-ast-runtime-operation
```

Result: **12/12 static source checks passed**. Checks cover the two internal entrypoints, typed interface, frozen operation object, production wiring, paired AST/definition artifacts, shared CLI manifest operation, complete/blocked manifest ADTs, zero `relationFoundation` references in core source, and both required empty directories.

Syntax-only TypeScript transpilation passed for both changed `.ts` files. `node --check` passed for the audit script; `package.json` parses as JSON. ZIP integrity was checked separately.

**Not verified:** full-project typecheck, unit tests, build, and CLI end-to-end execution were not run. Syntax transpilation is not a substitute for semantic type checking.

## Required directory constraint

`packages/core/src/semantic/relations/` and `packages/core/src/semantic/foundation/` remain present and empty (zero files). No contents were moved and no replacement foundation abstraction was added. Existing unresolved import/type errors are not concealed by introducing substitute modules.
