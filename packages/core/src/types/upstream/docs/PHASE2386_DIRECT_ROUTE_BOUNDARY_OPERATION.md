# Phase2386 — Direct Route Boundary Operation

## Objective

Continue the active route cutover using existing contracts. No new interface, authority, or ADT was introduced.

## Root cause addressed

The active scanner previously received `RouteEmission` values from the route emitter and converted each emission into `RouteBoundaryContract` afterward. This made an intermediate emission ADT part of the production data path even though the canonical boundary contract already existed.

## Implementation

1. Removed the `RouteEmission` ADT and emission-returning APIs from `routeEmitter.ts`.
2. Changed the existing resource and standard route operations to project resolved route facts directly into `RouteBoundaryContract`.
3. Changed the boundary projection to accept method, resolved path, resource, target, authorization, middleware, source file, and source line directly. The adapter no longer accepts `RouteEmission`.
4. Updated the active scanner to use `routeBoundaryContractFromRouteFacts` and `actionJudgmentForTarget`.
5. Updated existing audits to assert the new contract path rather than requiring the retired `RouteEmission` adapter.
6. No new upstream interface, authority, ADT, or duplicate operation contract was added.

## Active route data path after this change

`RouteDeclarationAst → RouteDeclarationEvidence → Existing Semantic Judgments → RouteBoundaryContract → RouteProducerInput → RouteProducer → RouteAst → RouteSemanticFlow`

The active scanner no longer imports or stores `RouteEmission`. The AST producer remains `types/upstream/routeProducer.ts`.

## Audits run

- Phase2380 closure-return contract: PASS 8/8
- Phase2381 evidence authority flow: PASS 8/8
- Phase2382 canonical contract reuse: PASS 14/14
- Phase2383 boundary executor integration: PASS 8/8
- Phase2384 boundary projection: PASS 8/8
- Phase2385 legacy scanner retirement: PASS 6/6
- Phase2385 emission consumer inventory (updated for the new state): PASS 6/6
- Phase2386 direct route boundary operation: PASS 8/8
- TypeScript syntax parse for the four changed TypeScript files: PASS

## Known gaps — not declared complete

- Boundary projection and producer-input composition still live under `compiler/scanner/subscanners/routeProducerRelations.ts`; this module remains an active subscanner dependency and must be retired through a proper owner/wiring cutover, not just renamed or moved.
- Direct boundary operations still live under `compiler/scanner/subscanners/route-scanner/routeEmitter.ts`; the old `RouteEmission` ADT is gone, but the route-scanner module itself is not yet retired.
- The route declaration method judgment still drives dispatch in `emitDeclaration`.
- `RouteProducerInput` is constructed after `RouteBoundaryContract`; this is an explicit composition step, not proof that invocation, operation, integrated response, and CLI end-to-end closure are all complete.
- Full typecheck did not pass in the available environment. Global `tsc --noEmit` is blocked by the repository's `ES2025` target/lib being unsupported by that compiler version and by two pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` (lines 47 and 221).
- No package build or end-to-end CLI regression was run. `npm run build` was not run.

## Status

**Partial integration complete.** `RouteEmission` has been removed from the production data path and from its former ADT/API. Full subscanner retirement, full typecheck, and CLI end-to-end regression remain open.
