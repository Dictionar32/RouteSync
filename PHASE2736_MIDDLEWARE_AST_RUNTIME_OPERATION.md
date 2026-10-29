# Phase 2736 — Middleware AST Runtime Operation and Upstream CLI Manifest Trace

## Scope

This phase continues the runtime migration from Phase 2735. It changes one real scanner entrypoint and its production consumer, while preserving the user's explicit requirement that `packages/core/src/semantic/relations/` and `packages/core/src/semantic/foundation/` remain empty. No source was moved out of those directories and no replacement foundation, wrapper, or compatibility layer was created.

## Runtime change

Source: `packages/core/src/compiler/scanner/subscanners/middlewareAstCanonical.ts`

- Replaced exported `async function scanMiddlewareAsts(...)` with internal `scanMiddlewareAstsImplementation`.
- Added `MiddlewareAstScanningOperationInterface`, with an explicit `SourceProjectIdentity` input and `Promise<readonly MiddlewareAst[]>` output.
- Exported `middlewareAstScanningOperation` as `MiddlewareAstScanningOperationInterface = Object.freeze({ scan: scanMiddlewareAstsImplementation })`.

Production consumer: `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts`

- Updated the actual middleware scanner wiring to call `middlewareAstScanningOperation.scan(sourceProject)`.
- This is not an examples-only change.

## Upstream CLI → manifest trace

```text
packages/cli/src/commands/scan.ts ─┐
                                   ├→ manifestScanOperation.scan(input)
packages/cli/src/commands/sync.ts ─┘
  → operation composed by packages/cli/src/upstreamCompositionFactory.ts
  → routeSyncCliManifestScanOperationFactory.create(manifestComposition)
  → manifest scan operation contract
  → controller invocation manifest composition authority
  → source identity / route and controller discovery
  → inventory validation
  → upstream manifest builder
  → manifest_builder_complete | manifest_builder_blocked
  → request-resolution preflight and manifest projection
```

The middleware operation is part of source-AST pipeline dependency wiring; this phase does not replace or bypass the upstream manifest authority. The builder's `complete` and `blocked` ADT outcomes remain distinct. The CLI scan and sync commands still share `manifestScanOperation.scan(...)`.

## Required empty directories

- `packages/core/src/semantic/relations/`: 0 files.
- `packages/core/src/semantic/foundation/`: 0 files.
- `relationFoundation` references under `packages/core/src`: 0.

Existing imports into the intentionally empty directories may still fail. They are deliberately not repaired with moved implementations or substitutes in this phase.

## Audit

Command:

```sh
npm run audit:phase2736-middleware-ast-runtime-operation
```

Result: **12/12 static checks passed**. The audit checks both empty directories, the interface-first middleware operation, its production consumer, the CLI manifest operation factory, scan/sync callers, complete/blocked manifest outcomes, and absence of `relationFoundation` references in core source.

The workspace currently contains **78 TypeScript files** under `packages/core/src/compiler/scanner/subscanners`; the wider scanner migration is not complete and this phase does not claim scanner is wiring-only.

## Verification limits

The audit is static. Full project typecheck, unit tests, build, and CLI end-to-end execution were not run in this phase. Because the relations and foundation directories must remain empty, unresolved imports are allowed to surface rather than being hidden.

## TypeScript reference

Official TypeScript object types documentation: https://www.typescriptlang.org/docs/handbook/2/objects.html
