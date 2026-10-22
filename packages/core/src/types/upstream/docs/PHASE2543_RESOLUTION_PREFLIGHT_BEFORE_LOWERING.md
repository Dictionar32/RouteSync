# Phase 2543 — Request Resolution Preflight Before Lowering

## Root cause

The Phase 2542 CLI gate assessed `routeManifestProjection.requestResolutionLedger`, but constructing that projection calls `routeManifestTypeLowering.project`, which in turn calls `requestTypeDerivationProjectionPipeline.derive`. The request-resolution gate therefore ran after the legacy `RequestType[]` solver had already executed.

## Change

`routeManifestRequestResolutionPreflight` now creates the canonical source-evidence inventory, resolves every route's request binding, and assesses the closed resolution ADT without importing the projection pipeline or legacy solver. Both CLI `scan` and `sync` persist the evidence and assessment, consume the closed assessment exhaustively, and only then call `projectRouteSyncManifestForRouteManifest` for a resolved assessment.

## Scope boundary

This closes the ordering defect in request-resolution preflight. It does not replace the legacy RequestType producer with a complete `RequestTypeDerivationJudgment`, does not verify the 32 proof laws, and does not claim authority-backed CLI closure. Those remain separate upstream implementation work.

## Verification

- `audit-phase2543-resolution-preflight-before-lowering.cjs`: 12/12
- `audit-phase2542-cli-request-resolution-closure.cjs`: 12/12
- `audit-phase2541-active-request-resolution-ledger.cjs`: 15/15
- `audit-phase2540-active-upstream-request-resolution.cjs`: 9/9
- Identity and resolver audits for phases 2530, 2531, 2532, 2535, 2537: all pass
- Phase 2431 authority closure audit: 10/10 and continues to report the legacy producer gap
- Full typecheck/build/runtime E2E: not run
