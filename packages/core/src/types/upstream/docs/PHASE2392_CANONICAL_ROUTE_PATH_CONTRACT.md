# Phase2392 — Canonical Route Path Contract

## Scope

This phase retires the duplicate/unused route path parser artifacts and makes the active route-boundary path consumers depend on the existing upstream `ResolvedLaravelRoutePath` contract.

## Audit findings

- `routePathParser.ts` had no active runtime callers; its only production use was as a type reference from route-boundary projection code.
- `routeContextTracker.ts` had no source references.
- `routeEmitter.phase48.test.ts` targeted `emitRouteInterfaceDirect`, which is not exported by the active emitter and did not represent the current route-boundary operation.
- The upstream route path contract already exists at `types/upstream/routePathResolution.ts`, with its canonical implementation in `routePathResolutionAuthority.ts`.

## Changes

- Updated `routeEmitter.ts` to type resolved path inputs as `ResolvedLaravelRoutePath` from the existing upstream contract.
- Updated `routeProducerRelations.ts` to consume the same canonical upstream path ADT rather than a type declared in the subscanner parser.
- Deleted the unused duplicate `routePathParser.ts` implementation.
- Deleted the unreferenced `routeContextTracker.ts`.
- Deleted the obsolete Phase48 test that imports a removed API.
- Added `scripts/audits/audit-phase2392-canonical-route-path-contract.cjs`.

No new interface, authority, ADT, dependency, or semantic wrapper was introduced. The existing upstream path-resolution authority remains the path resolution owner.

## Validation

- Phase2392 canonical path contract audit: PASS 8/8.
- Phase2380 audit: PASS 8/8.
- Phase2381 audit: PASS 8/8.
- Phase2382 audit: PASS 14/14.
- Phase2383 audit: PASS 8/8.
- Phase2384 audit: PASS 8/8.
- Phase2385 retirement audit: PASS 6/6.
- Phase2385 emission inventory audit: PASS 6/6.
- Phase2386 direct boundary audit: PASS 8/8.
- Phase2387 manifest operation audit: PASS 12/12.
- Phase2388 manifest semantic operation audit: PASS 11/11.
- Phase2390 CLI composition audit: PASS 13/13.
- Phase2391 invocation executor audit: PASS 10/10.
- TypeScript parser: PASS for the two changed TypeScript files.

These are structural audits and syntax parsing, not a full project typecheck or runtime test.

## Explicit remaining gaps

- The active `routeEmitter.ts` remains under `subscanners/route-scanner` and is still imported by `laravelRouteScanner.ts`. This phase does not claim the subscanner is retired.
- `routeProducerRelations.ts` remains an active dependency and still composes boundary contracts and producer input.
- `methodJudgment` dispatch remains in `laravelRouteScanner.ts`.
- Invocation integrated-response/runtime executor/CLI end-to-end execution is not validated here.
- Package build, Vitest, full TypeScript typecheck, and actual CLI `scan`/`sync` were not run.

## Next root-cause step

Audit the ownership of the active boundary projection and `RouteProducerInput` composition against existing upstream route contracts. Evolve an existing contract only if it can own the complete operation without pulling scanner-only types upstream. Do not treat moving emitter code into another file as subscanner retirement.
