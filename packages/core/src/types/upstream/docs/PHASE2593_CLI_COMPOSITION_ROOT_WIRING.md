# Phase 2593 — CLI composition-root wiring

## Change

`packages/cli/src/index.ts` now exposes `createProgramFromSemanticComposition`. This operation binds the existing concrete `controllerInvocationManifestCompositionAuthority` to the supplied semantic capability composition, delegates contract validation and pipeline assembly to `composeRouteSyncCliUpstream`, and constructs the CLI program only from the assembled composition.

The result is a closed ADT: either `routesync_cli_program_available` contains the exact composition and program, or the existing semantic assembly rejection is preserved. No producer, verifier, decision, or authority is synthesized here.

## Corrected path

`RequestTypeDerivationSemanticPipelineCompositionInterface`
→ `assembleRequestTypeDerivationProductionPipeline`
→ `composeRouteSyncCliUpstream(controllerInvocationManifestCompositionAuthority, semanticComposition)`
→ `RouteSyncCliUpstreamCompositionInterface`
→ `createProgram(composition)`
→ `scan` / `sync`
→ `projectRouteSyncManifestForRouteManifest`
→ authority-backed projection and lowering.

## What this closes

It removes the need for a host to separately select and pass the already-canonical manifest composition authority when it owns a valid semantic capability bundle. It connects the existing manifest authority, semantic assembler, CLI composition interface, and program factory through one named operation.

## What remains blocked

This is wiring, not a substitute for the missing production `RequestTypeDerivationSemanticReasoningInterface` implementation and independent verifier for all 34 canonical laws. The executable's zero-argument entry still cannot produce a semantic capability bundle by itself. The legacy `RequestType[]` solver must not be wrapped as a verified judgment. Full TypeScript typecheck, package build, and end-to-end CLI tests remain required in the project environment.
