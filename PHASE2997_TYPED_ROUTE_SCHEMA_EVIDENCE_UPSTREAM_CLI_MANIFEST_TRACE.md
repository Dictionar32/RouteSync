# Phase 2997 — Typed Route Schema Evidence, Runtime Path Trace, and Interface Audit

## Objective

Promote schema origin and inline-validation provenance to a source-owned typed value and preserve it through the active route-boundary and route-manifest projection. Keep the canonical schema payload as a projection of the evidence rather than letting consumers reconstruct schema origin from empty/non-empty fields.

## Implemented

- `ControllerActionSchemaRouteRequestEvidence<TSourceIdentity>` now owns `continueToSchema()`; the unavailable-evidence ADT also owns the same domain continuation, with an explicit reason.
- `ControllerActionSchemaSemanticJudgmentAuthorityInterface` publishes one frozen `routeRequestEvidence` value and `forRouteRequest()` returns that same value. Authority contract version advanced to 6.
- Canonical `LaravelControllerActionSemanticKnowledge` publishes `schemaEvidence` alongside the compatibility `schema` projection.
- `ControllerActionJudgmentRouteSelection` now exposes `continueToRouteSchemaEvidence()` for matched, unmatched, ambiguous, and invalid-publication outcomes. A matched outcome continues to the canonical evidence; failures carry an explicit unavailable-evidence reason. Route/action correlation contract version advanced to 4; controller scanner contract version advanced to 46.
- Controller-action projection, `RouteBoundaryOptions`, resolved boundary options, and `RouteBindingContract` carry the evidence value. The controller-reference route branch uses one selected evidence value for both schema payload and provenance.
- The route-manifest serializer explicitly preserves the route `binding` object, so the new `binding.schemaEvidence` field survives the route-manifest serialization projection.
- No new `export function` API was added. The changed runtime operations remain interface-owned values / ADTs; internal helpers are not mechanically exported.

## Runtime trace

`ControllerBodySemanticJudgment.validationEntries` + source identity + FormRequest evidence
→ `controllerActionSchemaSemanticJudgmentAuthority.judge(...)`
→ one `routeRequestEvidence` (`schemaOrigin`, `sourceIdentity`, `schema`, `inlineValidationEntries`, `continueToSchema()`)
→ `LaravelControllerActionSemanticKnowledge.schemaEvidence`
→ `ControllerActionJudgmentPublication`
→ `ControllerActionRouteCorrelationAuthority.judge(...)`
→ `ControllerActionJudgmentRouteSelection.continueToRouteSchemaEvidence()`
→ `routeDeclarationComposition`
→ `RouteBoundaryOptions.schemaEvidence`
→ `routeBoundaryInputResolution.resolve(...)`
→ `ResolvedRouteBoundaryOptions.schemaEvidence`
→ `routeBindingContractBuilder.build(...)`
→ `RouteBindingContract.schemaEvidence`
→ route semantic flow `binding`
→ `ManifestSerializer.serializeRoute(...)` preserves `binding`.

The compatibility `schema` field is now derived from `schemaEvidence.continueToSchema()` at the action/route boundary; it is not a second schema-origin authority.

## Laravel semantics checked

Laravel routes correlate a URI/method to a closure or controller action; validation can come from inline `$request->validate(...)` or a Form Request whose `rules()` are applied before the controller method. Therefore schema origin and inline-validation source entries are semantic evidence, not something a downstream route serializer should infer from schema cardinality. Official references: [Routing](https://laravel.com/framework/docs/routing), [HTTP Requests](https://laravel.com/framework/docs/requests), and [Validation / Form Requests](https://laravel.com/framework/docs/validation/latest).

## Interface / runtime export audit

- No `export function` declarations were found in the specifically traced active route composition, route scanner wiring, manifest lowerer, upstream manifest builder, CLI manifest scan operation, and manifest serializer modules.
- This phase did not mechanically rewrite unrelated exported helpers outside the reachable route/schema/manifest path. Any migration should be per runtime boundary: use an existing domain interface or add one only where the current ownership is genuinely missing; then publish `export const operation: ExistingDomainInterface = Object.freeze({...})`.
- ADTs carry follow-up domain operations (`continueToSchema`, `continueToRouteSchemaEvidence`) rather than only discriminants/data.
- `packages/core/src/types/upstream/collections.ts` remains intentionally empty. No deleted relation-foundation module was restored or introduced.

## Remaining gaps / honest limitations

- The route manifest's `binding.schemaEvidence` is preserved, while `EndpointContract.request.body.schema` remains a compatibility payload projection. If consumers need schema provenance inside the endpoint-contract body itself, add a typed contract field only after tracing all SDK consumers and serialization formats; do not duplicate schema ownership.
- The CLI controller-invocation manifest is a separate projection. This phase does not claim a proven field-by-field bridge from the action schema evidence into that separate invocation-manifest shape.
- The workspace still has pre-existing imports referencing removed relation foundation modules in older files (for example route-boundary helpers). They were not restored; full repository build remains blocked by that known dependency debt.
- Full typecheck, tests, CLI E2E, and a real Laravel fixture were not run because the workspace has no installed `node_modules`. TypeScript transpile syntax checks passed for the 18 touched TS files. Static audit assertions are structural checks, not behavioral proof.
