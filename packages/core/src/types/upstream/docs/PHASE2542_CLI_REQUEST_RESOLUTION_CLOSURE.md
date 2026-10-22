# RouteSync Phase 2542 — CLI Request Resolution Closure

## Scope

This phase closes one concrete failure mode on the active `scan` and `sync` projection path: request-resolution outcomes were retained as a ledger but did not gate manifest projection. An explicit missing or ambiguous Form Request could therefore disappear from `RequestType[]` while CLI continued.

## Active path before this change

`packages/cli/src/commands/scan.ts` / `sync.ts` → `projectRouteSyncManifestForRouteManifest` → `routeManifestProjection` → `routeManifestTypeLowering` → `requestTypeDerivationProjectionPipeline.derive` → legacy `createDerivationContext` / `aggregateRequestTypeGroups` → `RequestType[]`.

The request-resolution ledger was present as side data. It was not a semantic judgment, and the CLI did not inspect it before lowering the manifest.

## Implemented

- Added `RequestTypeRouteRequestResolutionResult` so unresolved route bindings are represented as `unresolved_binding`, not collapsed into `not_required`.
- The inventory records `unresolved_request` and `unresolved_action_request` explicitly. `no_request`, `framework_request`, and `typed_request` retain the existing `not_required` result for this Form-Request-specific derivation operation.
- Added upstream-owned `RequestTypeRequestResolutionAssessment` ADT and `RequestTypeRequestResolutionAssessmentInterface`.
- Added the typed operation value `requestTypeDerivationRequestResolutionAssessment` and exported it from the core package boundary.
- `scan` and `sync` now persist `routesync.request-type-resolution.json` and stop before manifest lowering when the assessment is `incomplete`, `conflict`, or `incomplete_and_conflicted`.
- The assessment deliberately does not claim to be `RequestTypeDerivationJudgment` and does not claim verification of the 32 semantic laws.
- No new dependency on `semantic/foundation` or `semantic/relations` was added.

## Verification

- `audit-phase2542-cli-request-resolution-closure.cjs`: 12/12 assertions passed.
- Phase 2541 request-resolution ledger audit: 15/15 passed.
- Phase 2535 request-resolution operation audit: 14/14 passed.
- Phase 2537 cardinality ADT audit: 11/11 passed.
- Phase 2530 semantic identity audit: 24/24 passed.
- Phase 2531 endpoint identity audit: 11/11 passed.
- Phase 2532 source occurrence identity audit: 13/13 passed.
- Phase 2431 active authority closure audit: 10/10 passed; it still correctly reports that the active lowering selects the legacy projection pipeline and no complete production reasoning implementation exists.
- TypeScript syntax parsing passed for all six modified TypeScript files.
- Dynamic assessment checks passed for `resolved`, `incomplete`, `conflict`, `incomplete_and_conflicted`, and unresolved-binding-as-incomplete.
- Full `tsc --noEmit` did not pass: the repository snapshot contains pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`, and the global TypeScript 5.8.3 compiler does not accept the repository's `es2025` target/lib settings. A targeted check also reports numerous pre-existing type errors elsewhere in the dependency graph. No package build was run because workspace `node_modules` is absent.

## Remaining root cause

This phase is a fail-closed gate over request-resolution closure, not a complete semantic producer. The active path still uses the legacy `RequestType[]` solver. The missing production reasoning implementation, verifier that validates all 32 proof laws, decision/authority composition, and full CLI cutover remain unresolved. Do not wrap the legacy solver output as a verified `derived` judgment.
