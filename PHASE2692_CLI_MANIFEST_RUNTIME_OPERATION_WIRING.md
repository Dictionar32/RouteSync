# Phase 2692 — CLI Manifest Runtime Operation Wiring

## Root cause

The prior core `RouteSyncManifestScanOperationInterface` modeled receipt-to-manifest operations, but the actual CLI `scan` and `sync` path still called `composition.manifestComposition.compose(...)` directly. That meant the new core scanner operation was not the interface seam used by those CLI commands. Structural checks of the core scanner alone did not prove CLI runtime wiring.

## Repair

- Added `packages/cli/src/manifestScanOperationInterface.ts` with `RouteSyncCliManifestScanOperationInterface`, named factory `createRouteSyncCliManifestScanOperation(...)`, and typed function-expression binding `bindRouteSyncCliManifestScanOperation`.
- Added `manifestScanOperation` to `RouteSyncCliUpstreamCompositionInterface`.
- Bound the operation to the exact host-provided `manifestComposition` in `composeRouteSyncCliUpstream`.
- Changed CLI `scan` and `sync` commands to call `composition.manifestScanOperation.scan(input)` instead of bypassing the interface with `.compose(input)`.
- Routed the compatibility `buildManifestWithInvocationPipeline` helper through the same operation contract.
- Exported the operation contract and factory from the CLI entry point.
- Preserved the composition input, explicit route selection, closed terminal judgment union, and authority-owned semantic composition; the adapter does not create or infer semantic judgments.

## Runtime trace

`CLI scan/sync → RouteSyncCliUpstreamCompositionInterface.manifestScanOperation → RouteSyncCliManifestScanOperationInterface.scan(input) → supplied ControllerInvocationManifestCompositionAuthorityInterface.compose(input) → source-project identity canonicalization → controller source discovery → source read and identity binding → source invocation semantic pipeline/delivery → invocation judgment authority → inventory closure authority → manifest builder preparation/build → closed ControllerInvocationManifest judgment → CLI's exhaustive blocker gate and downstream projection`.

The core `RouteSyncManifestScanOperationInterface` from prior phases remains a separate receipt-level scanner contract; it is not claimed to be the CLI entrypoint. The actual CLI entrypoint now has its own matching input/output contract at the correct architectural layer.

## Validation boundary

The Phase 2692 script checks source wiring only. Passing checks do not prove TypeScript compilation, package build, test-suite success, or Laravel end-to-end behavior. Those remain open until the project toolchain and dependencies are installed and those commands execute successfully.
