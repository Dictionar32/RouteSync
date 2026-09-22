# Trace Interface Upstream AST/ADT Repair — 2026-09-22

## Source of truth
`examples/ecommerce-shop-source` is the Laravel source authority. Existing manifests and trace artifacts are diagnostic only.

## Trace
Laravel source → canonical scanner → Producer AST/ADT → CompleteSourceAst → CompleteSourceModel → RouteSyncManifest.

## Finding 1 — Route capability loss
`ParsedRoute.capability` is a closed semantic contract containing authentication, security, middleware, policies, rate limiting, invalidation, CRUD/lifecycle, request content type, execution signature, and error responses.

The canonical `routeDefinitionFromParsedRoute()` previously copied only `auth` and `middleware` into `RouteDefinition`. The remaining capability datum stopped at `ParsedRoute`.

### Repair
- `RouteDefinition` now carries the existing `RouteCapabilityContract`.
- `RouteEndpointContract` now carries the same existing capability owner.
- `RouteScanner.routeDefinitionFromParsedRoute()` forwards `route.capability` without reconstruction.
- `routeNodeFromAst()` forwards `definition.capability` into the endpoint contract.

No `RouteCapabilityDescriptor` or replacement semantic interface was created.

## Finding 2 — discovery state was being flattened
`CompleteSourceAst` guarantees all categories were scanned, but `buildCompleteLaravelSourceModel()` projected `SourceDiscovery` with a conditional that converted every non-`discovered_many` state into `[]`. This could hide an invariant violation and erase the distinction between `discovered_empty` and an invalid `not_scanned` state.

### Repair
- Added ADT visitors `matchSourceDiscovery` and `matchDiscovered` to the existing discovery vocabulary.
- Complete model construction now treats `not_scanned` as a violated completeness invariant instead of silently producing an empty collection.
- `discovered_empty` remains explicitly empty; `discovered_many` preserves its existing `Sequence`.

No legacy adapter or duplicate discovery interface was introduced.

## Verification
The source edits were inspected structurally. Full TypeScript compilation remains blocked because this restored workspace has no `node_modules` / Node type definitions:

`TS2688: Cannot find type definition file for 'node'.`

Therefore compile/test success is not claimed.

## Remaining trace target
The largest remaining semantic projection is the legacy CLI `RouteManifest` / `Scanned*Descriptor` consumer path. The next repair must migrate that consumer to `RouteSyncManifest.sourceModel` rather than reconstructing a legacy manifest.
