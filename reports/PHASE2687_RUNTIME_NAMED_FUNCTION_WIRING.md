# Phase 2687 — Runtime named-function wiring

## Source-level root issue

The concrete manifest builder was exported through an interface-typed constant, but its `build()` method read `this.input` and `this`-bound dependencies. That made the operation's behavior depend on its receiver even though the interface described `build` as a zero-argument function. If a caller detached `build` from the returned operation, it could lose the receiver and fail before returning the manifest-builder ADT.

## Runtime changes

- Converted `prepareManifestBuilderOperation` in `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` into `export function prepareManifestBuilderOperation(input: ManifestBuilderInput): ManifestBuilderInterface`.
- The returned operation's `build()` closes over the explicit input and named prepared dependencies; it no longer reads `this.*`.
- Preserved `manifestBuilderOperationPreparation: ManifestBuilderOperationPreparationInterface` as the interface-typed composition value that delegates to the named function.
- Converted the CLI `buildManifestWithInvocationPipeline` entrypoint to a named exported function with typed parameters.
- Converted `routeSyncManifestFlowFromManifest` to a named exported function with a typed parameter and return value.
- Added `audit:phase2687-runtime-named-function-wiring` to inspect these concrete runtime files and the existing Phase 2686 trace.

## Verification

The Phase 2687 audit is a source-structure audit. A passing result does not prove TypeScript typecheck, Vitest, package build, or Laravel end-to-end execution. This workspace has no installed `node_modules` or built `dist` artifacts, so those checks must not be reported as executed.

Official reference: TypeScript's module documentation explains that exported functions are runtime module exports and interfaces are type-level declarations: https://www.typescriptlang.org/docs/handbook/modules/reference.html
