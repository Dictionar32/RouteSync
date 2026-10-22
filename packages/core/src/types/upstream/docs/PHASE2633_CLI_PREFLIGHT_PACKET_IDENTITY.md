# Phase 2633 — CLI Preflight Packet Identity Closure

## Root cause

`RouteManifestProjectionInterface` already defined the authority-backed projection input as `RouteManifestRequestResolutionPreflight`. That packet binds the exact manifest, semantic input, canonical source evidence inventory, request-resolution ledger, and resource-resolution ledger.

The composition introduced in Phase 2631 widened its public `project` input back to `RouteSyncManifest`, then called `projection.project(manifest)`. The CLI also passed `completeManifest`. This bypassed the established interface packet boundary and contradicted the actual `AuthorityBackedRouteManifestProjectionInterface` contract. In TypeScript this is a concrete type mismatch, not merely a naming/style concern.

## Changes

- `RouteManifestProjectionCompositionInterface.project` now accepts `RouteManifestRequestResolutionPreflight`.
- `createRouteManifestProjectionComposition` forwards the same `preflight` object to `projection.project(preflight)`.
- Lowering uses `preflight.manifest`; it does not rebuild a second manifest packet.
- Both CLI `scan` and `sync` pass the exact `requestResolutionPreflight` object produced immediately before projection.
- The Phase 2631 audit was corrected to assert packet identity rather than the obsolete `completeManifest` argument.
- The Phase 2613 audit was corrected to track the actual interface boundary.
- Added `audit:phase2633-cli-preflight-packet-identity` to `package.json`.

## Preserved architectural boundaries

The change does not create a new semantic authority, synthesize RequestType judgments, use a legacy `RequestType[]` fallback, or import `semantic/foundation` / `semantic/relation`. It reuses the existing upstream interface and packet.

## Verification

- Phase 2633 packet identity audit: 10/10 assertions.
- Phase 2631 projection wiring audit: 13/13 assertions.
- Phase 2613 CLI/upstream path audit: 14/14 assertions, including TypeScript syntax transpilation for five CLI files.
- Phase 2632 production capability root-cause audit: 11/11 assertions.

These are structural audits and syntax checks, not a full TypeScript project typecheck, package build, Vitest run, or Laravel fixture end-to-end test. The concrete production RequestType reasoning/verifier kernel remains a separate unresolved upstream capability gap.

## Laravel semantic note

Laravel resource declarations can expand into multiple routes, but `only`, `except`, API resources, nested resources, customized names, and parameter mappings change the resulting route set. RouteSync must therefore preserve and use the scanned source-bound manifest and its evidence packet rather than reconstructing resource semantics from a bare manifest at the projection boundary. See the official [Laravel Controllers documentation](https://laravel.com/framework/docs/12.x/controllers).
