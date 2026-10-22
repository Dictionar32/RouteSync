# Phase 2693 — Fully Typed Runtime Scanner Operations

## Root-cause finding

Phase 2691 named the scanner output contracts and removed `ReturnType` from the public facade, but the operation still accepted only the inventory closure receipt and internally forced `routeSelection: { kind: 'laravel_route_source_selection_default' }`. That meant the input contract did not fully describe scan intent: route selection was an implicit semantic choice inside the implementation rather than explicit typed operation data.

The CLI has its own `RouteSyncCliManifestScanOperationInterface`, used by `scan` and `sync` to call the composition authority. The core scanner is a separate lower-level seam that accepts the closed inventory receipt. The two contracts must not be conflated.

## Changes

- Added `RouteSyncManifestScanOperationInput`, a named interface containing both `invocationInventoryReceipt` and explicit `routeSelection: LaravelRouteSourceSelectionIntent`.
- Updated `RouteSyncManifestScanOperationInterface` to use the named input and explicit `Promise<RouteSyncManifestFlowScanJudgment>` / `Promise<ManifestBuilderJudgment>` outputs, with a versioned discriminant.
- Added `createRouteSyncManifestScanOperation(preparation)` as a named function so builder preparation is an explicit injected dependency.
- Added `bindRouteSyncManifestScanOperation` as a typed function-expression binding.
- Wired `routeSyncManifestScanOperation: RouteSyncManifestScanOperationInterface` to the canonical `manifestBuilderOperationPreparation` authority.
- Removed the hidden default route selection from scanner operations. The operation forwards `input.routeSelection` unchanged into `ManifestBuilderInput`.
- Preserved blocked builder judgments without converting them to success.
- Updated public facade signatures and core/orchestrator exports to expose the named input and result contracts.
- Added `scripts/audits/audit-phase2693-fully-typed-runtime-scanner-operations.cjs`.

## Runtime trace

```text
CLI scan/sync
  -> RouteSyncCliManifestScanOperationInterface.scan(composition input)
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> upstream source/identity/inventory/semantic pipeline
  -> ManifestBuilderInput(receipt, explicit routeSelection)
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> ManifestBuilderJudgment
  -> (if complete) RouteSyncManifestFlow projection
```

The lower-level core scanner seam is:

```text
RouteSyncManifestScanOperationInput
  -> RouteSyncManifestScanOperationInterface
  -> createRouteSyncManifestScanOperation(preparation)
  -> preparation.prepare({ receipt, routeSelection }).build()
  -> explicit discriminated judgment
```

## Validation

- Phase 2693 structural audit: **19/19 passed**.
- TypeScript `tsc --noEmit -p tsconfig.json`: **blocked by environment/toolchain**, not passed. Available compiler is TypeScript 5.8.3; the repository's `tsconfig` uses newer compiler options and local type dependencies (`node`, `vitest/globals`) are absent. The run also cannot resolve standard global types in this environment.
- Package build and integration tests: not run / not claimed successful.

The previous Phase 2690 audit script checks the older receipt-only operation signature and is superseded by Phase 2693. Its failures against the new input contract are stale assertions, not a replacement for typecheck. Use the Phase 2693 audit for the updated contract.

## Compatibility note

The public core scanner facades now take `RouteSyncManifestScanOperationInput` rather than a bare receipt. Callers must provide route selection explicitly, e.g. `{ kind: 'laravel_route_source_selection_default' }` or `{ kind: 'laravel_route_source_selection_explicit', selection }`. This is an intentional API contract change to prevent route selection from being silently hardcoded inside the scanner.

## Remaining semantic verification

1. Run typecheck/build with the repository-pinned TypeScript and installed workspace dependencies.
2. Run CLI integration tests for `scan` and `sync` with both default and explicit route selection.
3. Verify that AST/ADT semantic judgments, source identity, inventory closure evidence, and failure judgments remain complete through every producer/verifier boundary.
4. Close remaining decision, authority, and integrity producer/verifier gaps before claiming semantic completeness.
