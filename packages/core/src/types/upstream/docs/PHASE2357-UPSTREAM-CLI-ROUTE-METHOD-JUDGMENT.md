# Phase 2357 — Upstream CLI Route Method Judgment

## Scope

This phase continues from Phase 2356 by moving the final HTTP-method projection into the existing upstream `LaravelRouteDeclarationMethodJudgmentAuthority`. It does not create a parallel judgment authority or a per-method executor.

## Root cause

The method judgment previously carried source method/target evidence, but scanner wiring and route-producer projection still re-resolved method names through lookup tables. That duplicated the semantic projection after the upstream authority had already judged the declaration. The CLI path therefore had a closed declaration judgment but not a complete method-execution contract.

## Change

- Extended the existing `LaravelRouteDeclarationMethodJudgment` ADT with `httpMethods` on `any`, `match`, `query`, and `standard` arms.
- The upstream authority now owns the total typed mapping from `LaravelRouteTargetMethod` to `HttpMethod`, and `any` carries the canonical supported method set.
- Advanced the authority contract to version 7 and route scanner/scan judgment contracts to version 23.
- `laravelRouteScanner` consumes `methodJudgment.httpMethods` directly.
- `routeProducerRelations` consumes the same judged method set and `RouteEmission.method`; its duplicate raw-method lookup was removed.
- Added Phase 2357 static audit covering the actual CLI `scan` composition path through manifest builder, source-AST pipeline, and route scanner.

## Verified CLI path

`packages/cli/src/commands/scan.ts` → `buildManifestWithInvocationPipeline` → `controllerInvocationManifestComposition.ts` → `manifestBuilder.build(ManifestBuilderInput)` → `constructRouteSyncManifest` → `laravelSourceAstPipeline.execute` → `laravelRouteScanner.scan` → upstream method judgment → route emission/AST projection.

## Explicitly unresolved

This is **not yet a complete upstream/CLI migration**. The active `laravelRouteScanner.ts` still imports `semantic/relations` and route producer/emitter subscanner modules. The source-AST pipeline also imports several subscanner implementations. Those modules must be migrated through their existing upstream-owned contracts and wired through the CLI before the dependency-removal requirement can be claimed complete.

The static audit is not a TypeScript typecheck or a CLI end-to-end execution. No full build, Vitest run, or Laravel project CLI scan is claimed in this phase.
