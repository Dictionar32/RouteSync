# Phase 2561 — CLI Manifest Upstream Composition

## Root cause

Phase 2560 injected the request-type semantic pipeline but the CLI still invoked `buildManifestWithInvocationPipeline`, a concrete helper, rather than receiving the manifest producer authority as part of the same composition boundary. That left source-manifest production coupled to the command and prevented a host from supplying the manifest authority alongside the semantic pipeline.

## Change

- Added `RouteSyncCliUpstreamCompositionInterface`, a named, versioned composition contract joining the existing `ControllerInvocationManifestCompositionAuthorityInterface` and `RequestTypeDerivationSemanticPipelineInterface`.
- `createProgram`, `createScanCommand`, and `createSyncCommand` accept that composition object.
- Both commands require the semantic pipeline before source acquisition, then call `manifestComposition.compose` with the existing typed composition input.
- The default manifest authority remains available for the default executable, but missing semantic composition is not replaced with a legacy solver or a fabricated judgment.
- Existing canonical evidence inventory, occurrence identity, resolution preflight, authority-backed projection, and closed judgment path are preserved.

## Boundary

This phase wires the upstream manifest producer interface into CLI composition. It does not invent a production request-type reasoning implementation or claim that all 32 proof laws are verified. The executable still fails early when a host has not supplied the required semantic pipeline.

## Validation

Run `npm run audit:phase2561-cli-manifest-upstream-composition`. This is a structural and syntax-transpilation audit, not a full typecheck, package build, or end-to-end CLI test.
