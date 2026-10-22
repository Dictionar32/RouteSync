# RouteSync Phase 2631 — CLI Manifest Projection Interface Wiring

## Root cause

`packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts` already owned the full operation that joins the proof-backed RequestType projection with manifest lowering and exposes a closed result ADT (`manifest_projected | manifest_projection_blocked`). It was publicly exported from `packages/core/src/index.ts`.

However, both CLI commands bypassed that existing operation: they called `projectRouteSyncManifestForRouteManifest(...)`, switched on a lower-level projection result, and separately called `lowerRouteSyncManifestToRouteManifest(...)`. This duplicated orchestration in the CLI and left the existing upstream composition interface disconnected from the production path.

## Change

- `scan` and `sync` now invoke `createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(completeManifest, options.baseURL, '6.0.0')`.
- They consume the closed composition ADT directly: `manifest_projected` or `manifest_projection_blocked`.
- Manifest lowering now occurs only inside the existing upstream composition operation; CLI no longer manually lowers a manifest after a separate projection call.
- No new semantic authority, fallback, `semantic/foundation` dependency, or duplicate contract was introduced.

## Path after change

`Laravel source evidence → manifest composition authority → request-resolution preflight → injected RequestType semantic pipeline → RouteManifestProjectionCompositionInterface → closed projection judgment → manifest lowering → CLI output`.

## Verification limits

The Phase 2631 structural audit checks the two CLI consumers, the existing composition operation, the closed result ADT, and public export. Structural checks do not replace TypeScript typecheck, Vitest, package build, or end-to-end Laravel fixture execution.
