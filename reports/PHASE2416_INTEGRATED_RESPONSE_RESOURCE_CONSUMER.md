# Phase 2416 — Integrated Response Resource Consumer

## Scope

This phase starts the consumer migration from the legacy `RouteBindingContract.response` descriptor to the already-existing canonical `EndpointResponseBinding` / `LaravelControllerMethodResponseProduct.result` contract in response type derivation.

## Change

`responseContribution.ts` now treats `controller_method_response` as the owning source for resource response derivation:

- resolves the resource from `ResponseResult.resource` rather than `ResponseDescriptor.resourceName`;
- uses the canonical `ResponseCardinality` to select single versus collection response shape;
- handles `no_content` as an explicit canonical result;
- keeps the legacy descriptor branch only for non-method-response bindings.

No new semantic authority or duplicate response ADT was introduced.

## Limits (not complete migration)

This is a focused consumer migration, not full `ResponseDescriptor` retirement. Canonical `content`, `redirect`, `responsable`, `json_serializable`, and `branches` results are not yet projected by this consumer into `ResponseData`; this function returns the existing `RelationOption` none result for those canonical variants. The current route scanner still seeds a legacy `VoidResponseDescriptor` for compatibility and other consumers still read `binding.response`. Therefore the full Integrated Response → all consumers → IR/manifest chain is not closed by this phase.

## Validation

Run `node scripts/audits/audit-phase2416-integrated-response-resource-consumer.cjs` for focused source-contract assertions. Syntax transpilation and full typecheck results are recorded in `PHASE2416_VALIDATION.txt`. This phase does not claim a successful package build or live CLI run unless those checks were actually executed.
