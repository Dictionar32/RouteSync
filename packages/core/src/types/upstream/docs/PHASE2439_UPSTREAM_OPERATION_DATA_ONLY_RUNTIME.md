# Phase2439 — Prepared Operation Is Data; Runtime Only Executes

## Trace and root cause

Phase2438 removed source input from `RequestTypeDerivationRuntimeExecutorInterface.execute()`, but `RequestTypeDerivationPreparedOperation` still carried an `execute` callback. That callback could hide captured work and deferred the consumer projection into the object executed by runtime. The public method had zero parameters, but the operation crossing the boundary was still behavior rather than a closed operation/result value.

## Repair

- Evolved the existing `RequestTypeDerivationPreparedOperation` in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`; no duplicate interface was introduced.
- The prepared operation now carries the closed `RequestTypeDerivationRuntimeExecutionResult` as data.
- `createRequestTypeDerivationOperationPreparation` now derives, validates, classifies the closed authority outcome, and projects the verified judgment before returning the prepared operation.
- `createRequestTypeDerivationRuntimeExecutor.execute()` has no parameters and only returns `operation.result`; it has no semantic pipeline, judgment consumer, or deferred callback to invoke.
- Updated the existing type contract test to assert the data field rather than an executable callback.

## Important remaining blocker: active CLI path

`packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`. CLI `scan`/`sync` still reach `projectRouteSyncManifestForRouteManifest`. The authority-backed path requires a concrete `RequestTypeDerivationSemanticPipelineInterface`, but source trace found no production implementation of the complete reasoning + verifier + decision + authority chain. Wiring a fabricated producer or wrapping the legacy solver as a verified authority would create false semantic proof, so this phase deliberately does not claim the active CLI has been migrated. The next root fix is to implement and compose the real upstream capabilities against the existing contract, then switch the active manifest composition root and verify CLI regressions.

## Scope boundary

This phase closes the prepared-operation/runtime boundary for RequestType derivation only. It does not claim every runtime executor interface in the repository is parameterless; several other domains still expose parameterized executor contracts and require their own source-traced migration. Source scanners may accept source input at their acquisition boundary; the no-parameter rule applies to the runtime executor boundary.

## Verification

Run `node scripts/audits/audit-phase2439-upstream-operation-data-only-runtime.cjs`. This is a structural/source audit, not a TypeScript build, test-suite run, or CLI end-to-end proof.
