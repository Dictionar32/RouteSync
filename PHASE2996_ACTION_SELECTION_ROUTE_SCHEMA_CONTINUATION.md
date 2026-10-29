# Phase 2996 — Action Selection Route-Schema Continuation

## Objective
Close the concrete schema-loss point identified in Phase 2995: the `controller_reference` branch in route declaration composition used to inject `emptyRouteSchemaPayload()` even though a source-correlated `ControllerActionJudgmentRouteSelection` was already available.

## Source changes

1. `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
   - Each `ControllerActionJudgmentRouteSelection` ADT variant now owns `continueToRouteSchema(): RouteSchemaPayload`.
   - The continuation is domain-specific; no generic fold/callback abstraction was introduced.
   - Scanner contract version advanced from 44 to 45 because the selection contract changed.

2. `packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts`
   - A matched action continues to the canonical upstream `publication.judgment.semantic.schema`.
   - Unmatched, ambiguous, and invalid-publication outcomes explicitly continue to an empty schema payload; their ADT discriminants remain available to request-binding logic, so this fallback is no longer chosen independently by the route composition consumer.
   - Route/action correlation contract version advanced from 2 to 3.

3. `packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts`
   - The `controller_reference` route boundary now uses `actionJudgmentSelection.continueToRouteSchema()` instead of unconditionally constructing an empty schema.
   - The unmatched selection constructed at this boundary also provides the domain operation.

## Runtime trace

`LaravelControllerScanArtifact.actionJudgments`
→ `ControllerActionRouteCorrelationAuthority.judge(...)`
→ `ControllerActionJudgmentRouteSelection`
→ `continueToRouteSchema()`
→ `routeBoundaryContractFromRouteFacts(controller_reference)`
→ `RouteBoundaryOptions.schema`
→ `routeBoundaryInputResolution.resolve(options)` preserves `params.schema`
→ `routeBindingContractBuilder.build(...)` preserves `params.schema` in `RouteBindingContract.schema`
→ `ScannedEndpointContract.fromSubcontracts(...)` projects `subcontracts.binding.schema` into the body when the route capability has a payload
→ route flow / manifest AST
→ CLI manifest serializer.

The key behavior correction is that a matched controller/action reference now passes its canonical upstream schema into the route boundary instead of replacing it with an empty payload.

## Laravel semantics

Laravel routing binds a route to a controller action, while request validation can be declared in a Form Request or inline in the controller. RouteSync must therefore preserve the controller/action correlation and not manufacture a blank request schema after that correlation has succeeded. See the official [Laravel Routing](https://laravel.com/framework/docs/routing), [Controllers](https://laravel.com/framework/docs/13.x/controllers), and [Validation](https://laravel.com/framework/docs/validation/latest) documentation.

## Verification

- Static source audit: 8/8 checks passed.
- TypeScript `transpileModule` syntax checks: 4 changed TypeScript files produced zero syntax diagnostics.
- Full repository typecheck: not run; workspace has no installed `node_modules`.
- Test suite / end-to-end Laravel fixture: not run in this phase.
- ZIP integrity: checked after archive creation.

## Explicit remaining gap

This phase closes the schema-payload drop at the `controller_reference` boundary. It does **not** yet carry the complete `ControllerActionSchemaRouteRequestEvidence` (schema origin, source identity, inline validation entries) as one value through `RouteBoundaryContract`, serialized manifest, and IR. The route boundary currently receives `RouteSchemaPayload`; full provenance closure remains a separate required change. The CLI invocation manifest is also a distinct projection from the route manifest and must be audited separately.

## Runtime export policy

The touched runtime path uses interface-owned operation contracts and typed operation objects where already present. This phase does not mechanically rewrite unrelated `export function` declarations. Remaining exported functions must be audited by runtime reachability and converted only when their active runtime boundary has a precise domain interface; no generic abstraction or duplicate semantic owner should be introduced.
