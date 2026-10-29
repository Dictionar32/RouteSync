# Phase2941 — Upstream CLI Manifest Trace and ADT Operation Gap Audit

## Purpose

Continue the Phase2940 source-read integration by tracing the complete CLI manifest path and isolating the remaining domain-dispatch gap. This phase records the next implementation boundary; it does not claim that downstream branching or repository-wide `export function` declarations have been eliminated.

## Canonical runtime trace

1. `packages/cli/src/commands/scan.ts` and `packages/cli/src/commands/sync.ts` acquire `composition.manifestScanOperation` and call `scan(...)`.
2. `packages/cli/src/upstreamCompositionFactory.ts` wires `routeSyncCliManifestScanOperationFactory.create(manifestComposition)`.
3. `packages/cli/src/manifestScanOperationInterface.ts` provides the typed CLI scan operation factory.
4. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` wires `controllerInvocationManifestCompositionAuthority` and the shared `phpSourceDocumentReader` from `@routesync/core`.
5. The composition authority invokes the source-AST pipeline and existing source inventory / invocation judgments.
6. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` prepares and executes `LaravelRouteScannerInterface`.
7. `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` resolves selected route files, observes missing files, reads selected sources through `PhpSourceDocumentReaderInterface`, and passes the results to `phpSourceDocumentReadBatchFactory`.
8. The read-batch ADT either continues with complete documents or preserves read-blocked evidence. The route scanner then produces a route-scan judgment or a typed blocker.
9. The source-AST projection judgment is consumed by manifest construction. CLI scan/sync use the manifest result's `continueForDriftAudit(...)` operation to preserve complete and blocked outcomes.

## Verified upstream contract reuse

The current path reuses existing contracts instead of adding a generic result/helper layer:

- `packages/core/src/types/upstream/phpSourceFrontendInterface.ts`: `PhpSourceDocumentReaderInterface`, `PhpSourceDocumentReadResult`, and read-batch continuation.
- `packages/core/src/types/upstream/filesystemFailureInterface.ts`: filesystem failure code ADT.
- `packages/core/src/types/upstream/laravelRouteScannerInterface.ts`: route scanner authority and route-scan judgments.
- `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`: AST projection judgment and manifest continuation.
- `packages/core/src/types/upstream/manifestBuilderInterface.ts`: manifest build judgment.

`packages/core/src/types/upstream/collections.ts` remains empty.

## Remaining root-cause gap

`laravelSourceAstPipeline.ts` still performs direct `routeScan.kind` dispatch for:

- `laravel_route_scan_blocked`
- `laravel_route_scan_source_read_blocked`
- `laravel_route_scan_response_blocked`
- `laravel_route_scan_policy_blocked`

This is a concrete violation of the strictest “runtime without downstream reasoning” target. Only the source-read-blocked ADT currently owns a `continueToSourceAstProjection()` operation; the other blocker variants do not share an equivalent domain-owned continuation. Do not solve this by adding a generic `Result<T>`, generic visitor utility, or another wrapper that merely relocates the same branching.

### Recommended next change

Evolve the existing route-scan ADTs in `laravelRouteScannerInterface.ts` and their existing constructors in `routeDeclarationComposition.ts` so each outcome owns a domain operation that preserves its exact evidence when continuing into source-AST projection. The complete route-scan outcome must also own its continuation into the remaining AST pipeline. Then replace the four consumer-side `routeScan.kind` checks with one domain-owned continuation call. Keep the blocker evidence intact; never map a blocked scan to an empty route inventory or complete manifest.

Before implementation, check all producers/consumers of `LaravelRouteScanJudgment`, `LaravelRouteScanPolicyBlockedJudgment`, `LaravelRouteScanResponseBlockedJudgment`, and `LaravelRouteScanBlockedJudgment`, because the operation addition affects every constructor and test fixture. Keep the existing contract versions and update them only alongside all producer/consumer migrations.

## Runtime export migration status

The interface-first style is already used on the Phase2940 shared reader and selected composition operations. A repository text scan still finds exported function declarations under `packages/core/src` and `packages/cli/src`; the global migration is not complete. Migrate along traced runtime paths and reuse existing operation interfaces, rather than applying blind textual replacement to declarations without a matching contract.

## Verification status

This document is an audit and implementation plan based on the checked workspace source. Phase2940's existing audit remains 11/11 structural checks and syntax-only transpilation 7/7. Full project typecheck, unit tests, build, and CLI end-to-end remain unverified due to missing project/global type dependencies and compiler configuration mismatch in this environment.
