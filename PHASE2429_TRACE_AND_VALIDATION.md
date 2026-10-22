# Phase 2429 — Trace and Validation Evidence

## Active CLI trace

`packages/cli/src/commands/scan.ts` and `sync.ts` call `projectRouteSyncManifestForRouteManifest(completeManifest)`. That function currently resolves to `routeManifestProjection`, which uses `routeManifestTypeLowering`. The default `routeManifestTypeLowering` still invokes `requestTypeDerivationProjectionPipeline.derive(...)`; that pipeline delegates to `createDerivationContext` and `aggregateRequestTypeGroups` in `requestTypeDerivationSolver.ts`.

## New authority-backed integrated operation

`createIntegratedRouteManifestAuthority(pipeline)` now composes the existing authority-backed projection path with the existing manifest lowerer. The projection invokes `createRequestTypeDerivationRuntimeExecutor`; only the `projected` ADT variant reaches `lowerRouteSyncManifestToRouteManifest`. All other outcomes are returned as `manifest_derivation_blocked` with source evidence and the original derivation result.

This prevents callers of the new operation from converting incomplete, conflicted, rejected, or verification-failed judgments into a manifest. The operation requires the semantic pipeline as explicit input and does not create an implicit fallback.

## Validation actually run

- `node scripts/audits/audit-phase2429-integrated-route-manifest-authority.cjs`: PASS, 11/11.
- TypeScript transpile syntax check for `integratedRouteManifestAuthority.ts`: PASS, 0 syntax diagnostics.
- TypeScript transpile syntax check for `packages/core/src/index.ts`: PASS, 0 syntax diagnostics.
- Focused `tsc --noEmit --target ESNext --module ESNext --moduleResolution Bundler --skipLibCheck packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts`: EXIT 2 due to pre-existing errors in transitive files (e.g. `primitiveHandlers.ts`, `routeManifestLowerer.ts`, `routeManifestProjectionInputs.ts`, `propertyProcessor.ts`, `contracts.ts`, and others). No diagnostic named `integratedRouteManifestAuthority.ts` or its new export.
- Full package build, Vitest, and live CLI scan/sync integration were not run.

## Closure status

This phase adds the missing authority-to-integrated-manifest operation, but it does not close the full CLI path. The repository still lacks production implementations for the reasoning, independent verifier, decision, and authority capabilities needed to assemble `RequestTypeDerivationSemanticPipelineInterface`. The default CLI path still uses the legacy projection pipeline until a genuine producer is implemented and injected. No claim of end-to-end interface-first closure is made.
