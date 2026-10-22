# Phase2384 — Canonical Boundary Projection at Emitter Invocation

## Scope

Continue the active RouteSync route-flow integration using existing contracts. No new upstream authority or ADT was added.

## Code changes

- Added `emitResourceRouteBoundariesFromJudgment` and `emitStandardRouteBoundaries` in the existing `routeEmitter.ts` owner.
- These entrypoints return `RouteBoundaryContract[]`, immediately project each transient emitter result through the existing boundary projection supplied by the active scanner, and prevent `RouteEmission[]` from crossing back into the active scanner's datum stream.
- Updated `laravelRouteScanner.ts` to invoke the boundary-producing operations instead of calling the legacy emission functions and mapping their arrays itself.
- Exported both operations through the existing `route-scanner/index.ts` module.
- Updated Phase2383 structural assertions to test the new current integration boundary rather than the old call-site `.map(...)` spelling.
- Added `scripts/audits/audit-phase2384-boundary-projection-at-emitter.cjs`.

## Validation

- Phase2383 active boundary/executor audit: PASS 8/8.
- Phase2384 boundary-projection integration audit: PASS 8/8.
- No full TypeScript typecheck, package build, or end-to-end CLI regression was run. The ZIP workspace has no `node_modules`; per the established project constraint, `npm run build` was not run.

## Remaining gap — explicitly not closed

This phase moves the boundary projection into the existing emitter operation entrypoint and ensures the active scanner consumes only canonical boundary contracts. It does **not** yet eliminate the transient `RouteEmission`-shaped internal values inside the legacy emitter implementation. The projection callback still receives that transient value, and the legacy `RouteScanner` path still uses the older emission API. Therefore this is not a claim that the `RouteEmission` type has been fully retired repository-wide.

The next safe cutover is to migrate the legacy `RouteScanner` path and then replace the transient emission representation with direct construction of the existing `RouteBoundaryContract`, after tracing all target/request/response/resource/path/provenance fields and consumers. No new contract should be introduced unless that trace proves an existing contract cannot represent a required semantic fact.
