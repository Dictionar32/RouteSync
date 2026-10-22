# RouteSync Phase2419 — Active Manifest Interface-First Closure Trace

## Scope

This phase traces the actual `scan` and `sync` CLI path from the upstream source-AST/manifest boundary into the route-manifest projection. It does not claim a full end-to-end runtime test.

## Verified active path

`LaravelRouteScannerInterface.scan` → `LaravelSourceAstPipeline` → `LaravelSourceAstProjectionJudgment` → `ManifestBuilderJudgment` → CLI `scan`/`sync` → `projectRouteSyncManifestForRouteManifest` → `routeManifestProjection` → `routeManifestTypeLowering`.

The source-AST pipeline returns a `laravel_source_ast_projection_route_response_blocked` judgment when the route scanner returns `laravel_route_scan_response_blocked`. The manifest builder preserves any non-complete source-AST projection as `manifest_builder_blocked`. Both CLI commands stop on that result before calling route-manifest projection or writing generated manifest output. This preserves the response blocker rather than reclassifying it as a successful empty response.

## Important finding: Phase2417 IR helper is not active

`buildResponseReference()` in `packages/core/src/ir/domain/request-endpoint/endpointRefs.ts` has no production callsite in the inspected source; its name appears only at its declaration in that file. Therefore, the Phase2417 `integrated_response` and `blocked` variants do not by themselves establish that the active CLI route-manifest projection consumes those variants. Do not treat the helper's structural audit as production wiring evidence.

## Upstream contract inventory

The existing `EndpointResponseBinding` ADT already contains `controller_method_response` and `controller_response_projection_blocked`. The existing `ManifestBuilderJudgment` already has a `manifest_builder_blocked` variant carrying the exact non-complete source-AST projection. These contracts are sufficient for the verified blocker path; this phase does not add parallel response ADTs.

## Remaining upstream gap discovered

The active `routeManifestTypeLowering.ts` calls `requestTypeDerivationProjectionPipeline.derive(...)`, which directly uses `createDerivationContext` and `aggregateRequestTypeGroups`. The authority-backed alternative (`createAuthorityBackedRouteManifestProjection`) is not wired into `routeManifestProjection`, and no concrete `RequestTypeDerivationSemanticPipelineInterface` implementation was found in `packages/core/src` by source search. The interface and executor exist, but a closed producer of its assessment is missing from the active path.

This is not safe to “fix” by swapping in the authority-backed adapter with a fabricated pipeline or by treating the current solver as if it emitted the required proof. The upstream operation must first have a real implementation that derives and validates the existing judgment/assessment contract. Until then, the active RequestType path is not fully interface-first, even though the response-blocker path is closed.

## Technical reference

TypeScript documents discriminated unions as a way to narrow a value using a literal discriminant and to enforce exhaustive handling of variants: https://www.typescriptlang.org/docs/handbook/2/narrowing.html

Laravel documents materially distinct response forms including JSON, redirects, files, and streamed responses; these distinctions support preserving response semantics rather than flattening unknown or blocked cases: https://laravel.com/framework/docs/13.x/responses

## Validation

`node scripts/audits/audit-phase2419-active-manifest-interface-first-closure.cjs` — 13/13 assertions passed.

The audit is source-structural evidence only. It does not prove that Vitest, package build, or a live Laravel CLI run passes. Those checks were not run in this phase.
