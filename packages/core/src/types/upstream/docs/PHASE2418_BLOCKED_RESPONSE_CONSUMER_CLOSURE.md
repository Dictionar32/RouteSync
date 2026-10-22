# Phase 2418 — Active Response Consumer Closure

## Audit → Trace

The active path is not `packages/core/src/ir/domain/request-endpoint/endpointRefs.ts`: repository-wide reference search found `buildResponseReference()` only in its own declaration and the historical Phase 97 test. It is not called by manifest lowering or CLI production code. Therefore the Phase2417 helper/ADT addition alone did not establish production Integrated Response wiring.

The active route response shape path is:

`RouteSyncManifest.ast.ast.routeFlows` → `routeManifestTypeLowering` → `SemanticTypeDeriver.derive(..., routes)` → `deriveRouteResponseTypes` → `extractRouteResponseShape`.

The active request response contribution path is:

`RouteSemanticFlow.binding.responseProjection` → `deriveActionResponseData` → response type derivation.

## Root cause

Two active consumers still used compatibility surfaces instead of consistently following the upstream response contract:

1. `shapeExtractor.ts` read the flat `route.response` descriptor even though the actual `RouteSemanticFlow` owns `binding.responseProjection`.
2. `responseContribution.ts` correctly used `LaravelControllerMethodResponseProduct.result` for method responses, but its generic non-method branch could still read `RouteBindingContract.response` after an explicit `controller_response_projection_blocked` judgment.

A structural audit of Phase2417's `buildResponseReference()` also found it had no production call sites. It must not be presented as evidence that the active manifest/type-lowering/CLI path consumes the new `ResponseReference` variants.

## Changes

- Migrated the active `shapeExtractor.ts` to read `route.binding.responseProjection`.
- For `controller_method_response`, it projects a response shape only when the existing canonical `ResponseResult` is `resource`, and derives single/collection shape from its canonical cardinality.
- Non-resource integrated response variants and non-method endpoint bindings do not get reclassified from a compatibility descriptor by this shape extractor.
- Added explicit blocker guards in `responseContribution.ts` before either compatibility-descriptor read.
- Reused `EndpointResponseBinding`, `LaravelControllerMethodResponseProduct`, `ResponseResult`, and the existing response shape operation. No new semantic authority/ADT and no `semantic/foundation` dependency were added.
- Added active-path and blocker-consumer source audits.

## Technical references

- TypeScript Handbook, discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- Laravel HTTP response forms (JSON, redirects, file and streamed responses): https://laravel.com/framework/docs/13.x/responses

These references support preserving response variants rather than flattening different semantics into a compatibility descriptor. They do not substitute for repository-level verification.

## Validation evidence

- `audit-phase2418-active-response-consumer-trace.cjs`: 11/11 source assertions passed.
- `audit-phase2418-blocked-response-consumer-closure.cjs`: 10/10 source assertions passed.
- Phase2415 blocker propagation: 14/14.
- Phase2416 resource consumer: 8/8.
- Phase2417 canonical response handoff: 13/13 (this remains a structural audit of the separate IR helper, not proof of active production call-site use).
- Phase2391 invocation pipeline/executor injection: 10/10.
- Phase2397 integrated-response composition injection: 8/8.
- Phase2398 controller dataflow operation closure: 10/10.
- Phase2399 invocation judgment manifest/CLI forwarding: 8/8.
- TypeScript syntax transpilation and project typecheck results are recorded in `PHASE2418_VALIDATION.txt`.

## Still open

- The complete Invocation Semantic Judgment → Integrated Response → runtime executor → manifest → CLI chain has not been run end-to-end.
- `ResponseDescriptor` compatibility consumers still exist outside the two repaired consumers and need their own active-call-site trace before migration.
- Non-resource `ResponseResult` variants are not converted into resource-shaped response types here; they are not guessed or downgraded to `void`/`empty`.
- No package build or live CLI scan/sync is claimed.
