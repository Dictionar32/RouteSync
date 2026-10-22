# Phase 2691 — Fully Typed Runtime Scanner Operations

## Root cause
`scanRouteSyncManifestFlow` used `ReturnType<RouteSyncManifestScanOperationInterface['scanFlow']>`. Although type-safe, this derived the public function's return contract indirectly instead of declaring the operation's semantic result explicitly. The operation interface also embedded the successful flow result inline, preventing that result from being a named, independently exportable contract.

## Repair
- Added exported `RouteSyncManifestFlowCompleteJudgment` interface.
- Added exported `RouteSyncManifestFlowScanJudgment` discriminated union alias combining the explicit successful flow result with `ManifestBuilderBlockedJudgment`.
- Changed `RouteSyncManifestScanOperationInterface.scanFlow` to explicitly return `Promise<RouteSyncManifestFlowScanJudgment>`.
- Changed the public `scanRouteSyncManifestFlow` facade to explicitly return `Promise<RouteSyncManifestFlowScanJudgment>`; removed `ReturnType` inference.
- Preserved explicit `Promise<ManifestBuilderJudgment>` on `scanManifest` and its public facade.
- Exported the named result contracts from the orchestrator barrel and core public entry point; removed a duplicate existing type export.
- Added audit assertions against inline/derived return typing and for public export wiring.

## Validation
`node scripts/audits/audit-phase2690-runtime-scanner-operation-interface.cjs` passes 16/16 structural checks after this repair.

This is a source-structure audit only. TypeScript compilation, package build, and runtime integration tests are not claimed as passed.
