# Phase 831 — Route Consumer Wiring Truth

## Objective

Correct the route consumer trace and preserve the established rule: legacy route files remain in the tree and are emptied only after reachability is proven zero.

## Findings

The Phase 829 audit used an incorrect TypeScript extension matcher and could report an empty production surface incorrectly. Phase 831 uses the corrected `/\.(ts|tsx)$/` matcher and excludes tests by path/name.

The corrected trace shows the remaining duplicate route producer is specifically:

`packages/cli/src/utils/incremental/descriptors/scannedRouteDescriptor.ts`

The canonical core route path remains:

`RouteEmission -> RouteBoundaryContractFactory -> RouteProducerInput -> routeProducer.produce() -> RouteAst`

`routeProducerRelations.ts` has no dependency on the CLI factory, legacy factory tree, or legacy `RouteSemanticFlow`.

## Important distinction

The CLI incremental factory is a second producer and must not be replaced by another compatibility factory. The existing core route vocabulary is already sufficient. The next cutover must wire the incremental route state to the existing `RouteSemanticFlow` / `RouteAst` authority and remove the duplicate producer only after its consumers have been migrated.

## Preserved legacy files

The legacy core factory paths are preserved during cutover. Implementations that were already emptied remain empty. `routeMutations.ts` was restored as an empty placeholder in this phase to keep the legacy path stable.

## Current frontier

- CLI duplicate factory implementation: still present and reachable from the incremental barrel.
- CLI `RouteSemanticFlowLegacy` union: still present.
- Canonical core producer: unchanged and authoritative.
- No new semantic model or adapter was introduced.

## Next cutover

1. Trace every consumer of `ScannedManifest.routes` and `RouteSemanticFlow` in the incremental subsystem.
2. Wire those consumers to the existing core route semantic authority.
3. Remove the CLI factory from the incremental barrel once its consumers reach zero.
4. Empty `scannedRouteDescriptor.ts` only after reachability is zero.
5. Then trace the remaining serialized incremental manifest compatibility boundary.
