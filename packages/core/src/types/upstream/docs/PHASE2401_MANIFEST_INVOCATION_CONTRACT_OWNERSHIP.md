# RouteSync Phase 2401 — Manifest Invocation Contract Ownership

## Audit and trace

Phase 2399 added `invocationSemanticJudgments` to the AST-free `RouteSyncManifestFlow` and exposed it to both CLI commands. The producer, however, sourced the flow property from `manifest.ast.ast.controllerInvocationSemanticInventory.correspondences`. This meant the projection reached backward through construction AST state instead of consuming a contract owned by the concrete manifest itself.

## Root cause

The authority-closed inventory receipt was already an input to `constructRouteSyncManifest`, but its correspondence set was not copied into the concrete `RouteSyncManifest` contract. The flow projection therefore bypassed the manifest contract to recover the exact judgments from the AST aggregate.

## Change

- Evolved the existing `RouteSyncManifest` with `invocationSemanticJudgments`, typed with the existing `LaravelControllerInvocationSemanticJudgmentInterface` ADT.
- `constructRouteSyncManifest` now carries `invocationInventoryReceipt.correspondences` directly onto the concrete manifest. It does not map, reconstruct, or reclassify the judgments.
- `routeSyncManifestFlowProjection` now reads `manifest.invocationSemanticJudgments` and no longer references `manifest.ast`.
- Updated the Phase 2399 structural audit to enforce the corrected producer-to-manifest-to-flow path.
- Added `audit-phase2401-manifest-invocation-contract-ownership.cjs`.

## Authority chain after this phase

`Inventory authority → validated receipt → concrete RouteSyncManifest.invocationSemanticJudgments → RouteSyncManifestFlow.invocationSemanticJudgments → scan/sync artifact serialization`

The CLI remains a serializer of the existing judgment ADT. It does not infer invocation meaning or inspect controller ASTs.

## Verification boundary

The Phase 2401 structural audit and related source audits are not a substitute for runtime verification. This phase did not run the package build, full typecheck, Vitest, or real Laravel `scan`/`sync` execution. The workspace does not have a local TypeScript installation available for compiler-based validation.
