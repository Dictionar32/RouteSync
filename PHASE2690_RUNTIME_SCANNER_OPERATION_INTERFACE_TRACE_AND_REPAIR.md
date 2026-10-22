# Phase 2690 — Runtime scanner operation interface trace and repair

## Objective

Continue Phase 2689 by modelling the scanner entry points themselves as an explicit runtime operation interface. The change is applied to `packages/core/src/compiler/scanner/orchestrator/`, not to examples.

## Root cause / gap

Phase 2689 routed the scanner through the `ManifestBuilderOperationPreparationInterface`, but the public scanner entry points (`scanRouteSyncManifestFlow` and `scanRouteSyncManifest`) still contained their operation bodies directly. There was no named contract for those two runtime operations, and no single interface-typed operation value owning their behavior.

## Changes applied

- Added `RouteSyncManifestScanOperationInterface` with typed `scanFlow` and `scanManifest` call signatures.
- Added `routeSyncManifestScanOperation: RouteSyncManifestScanOperationInterface` as the runtime operation value.
- Moved the scanner operation bodies behind that interface-typed value. Both operations continue to call `manifestBuilderOperationPreparation.prepare(...)`.
- Kept the exported function declarations as compatibility facades, delegating to `routeSyncManifestScanOperation`.
- Kept blocked builder judgments intact; the flow operation propagates `manifest_builder_blocked` rather than synthesizing a success result.
- Exported the operation and its interface from the orchestrator barrel and core public entrypoint.
- Added `scripts/audits/audit-phase2690-runtime-scanner-operation-interface.cjs` and an npm script `audit:phase2690-runtime-scanner-operation-interface`.

## Runtime trace

```text
CLI scan/sync entry
  -> buildManifestWithInvocationPipeline / composition authority
  -> canonical composition dependencies
  -> manifestBuilderOperationPreparation.prepare(input)
  -> ManifestBuilderInterface.build()
  -> ManifestBuilderJudgment
  -> routeSyncManifestScanOperation.scanManifest(receipt)
     or routeSyncManifestScanOperation.scanFlow(receipt)
  -> blocked judgment OR AST-free RouteSyncManifestFlow projection
  -> stable exported scanRouteSyncManifest* facade
```

The scanner operation contract accepts the closed invocation inventory receipt; route selection remains explicit in the builder input. The flow facade projects only the semantic flow fields and does not expose the construction AST.

## Verification

- Phase 2690 operation-interface structural audit: **12/12 passed**.
- Phase 2689 CLI-to-manifest structural audit: **12/12 passed**.
- Phase 2686 upstream CLI manifest trace audit: **12/12 passed**.
- Phase 2687 named-function wiring audit: **9/9 passed**.
- Phase 2688 function-expression wiring audit: **9/9 passed**.
- `package.json` parses successfully.
- TypeScript build/typecheck is **not verified**. The extracted workspace has no installed dependencies and global TypeScript is 5.8.3, while this repository's tsconfig uses compiler options/types not supported or present in that environment (`node`, `vitest/globals`, and newer target/lib settings). The `tsc --noEmit -p tsconfig.json` attempt therefore failed before it could validate this change.

## Remaining upstream issues

This phase does not claim the full semantic producer/verifier chain is complete. Existing diagnostic composition gaps for decision, authority, and integrity remain separate work. Continue tracing AST/ADT -> semantic judgments -> identity/inventory closure and add behavior tests for both blocked and complete runtime results in a dependency-installed environment.
