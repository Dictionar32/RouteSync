# Phase 2825 — Fully Typed Runtime Scanner Operations and CLI Manifest Trace

## Scope applied

This phase continues the route syntax runtime migration begun in Phase 2824. The following runtime exports in `packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts` are now interface-first frozen operation objects, and the parser calls those operation methods rather than the former function-shaped exports:

- `routeConstraintFactOperation.derive`
- `routeConstraintArgumentAstOperation.project`
- `isGroupWhereOperation.test`
- `emptyRouteGroupStateFactory.create`
- `routeGroupBindingScopeLookupOperation.lookup`
- `routeGroupPropertyLookupOperation.lookup`
- `routeGroupConstraintFactOperation.derive`
- `advanceRouteGroupStateOperation.advance`
- `routeGroupPendingStateOperation.advance`
- `routeTargetDescriptionOperation.describe`
- `routeTargetAstOperation.project`
- `mergeRouteGroupStatesOperation.merge`
- `routeInvocationFactOperation.derive`
- `routeInvocationMethodOperation.resolve`

The route syntax ADT still uses the existing domain-specific `RouteSyntaxSemanticFact.continueForProofRelation` operation. No generic reasoning dispatcher or parallel route syntax judgment was added. `packages/core/src/types/upstream/collections.ts` remains exactly zero bytes.

## Existing contracts reused

No new upstream manifest contracts were introduced because the existing contracts already cover the boundary:

- `RouteSyncCliManifestScanOperationInterface` and its factory in `packages/cli/src/manifestScanOperationInterface.ts`.
- `RouteSyncCliUpstreamCompositionInterface` in `packages/cli/src/upstreamCompositionInterface.ts`.
- `ControllerInvocationManifestCompositionAuthorityInterface` in `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts`.
- `LaravelSourceAstPipelineInterface` in `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts`.
- `SemanticDataflowManifestSurfaceInterface` in `packages/core/src/types/upstream/semanticDataflowManifestSurface.ts`.
- `ManifestBuilderJudgment`, whose closed union preserves `complete` versus `blocked`, in `packages/core/src/types/upstream/manifestBuilderInterface.ts`.

The existing upstream barrel explicitly exports the source AST pipeline, semantic dataflow manifest surface, and manifest builder contracts. The CLI barrel explicitly exports the CLI scan and controller invocation composition contracts. These existing exports are retained rather than adding duplicate names.

## Runtime trace

1. CLI composition creates the typed scan operation from the existing controller invocation composition authority.
2. `scan`/`sync` call the scan operation with a typed composition input.
3. The controller invocation composition authority acquires and validates source-document identity/inventory, then invokes the existing source AST pipeline and manifest preparation/build boundary.
4. The source AST pipeline produces an explicit complete/blocked source result; the manifest builder preserves its closed complete/blocked judgment rather than treating blocked source as an empty successful manifest.
5. The resulting complete manifest enters the CLI route-manifest flow/dataflow projections and request-resolution preflight.
6. The request-type semantic pipeline is the authority gate for downstream projection. A blocked derivation remains a blocked outcome; the CLI does not substitute a legacy `RequestType[]` fallback.
7. Contract validation, serialization, and persistence each retain their explicit success/rejection outcomes.

## Audit result and suggestions

`audit-phase2825-fully-typed-runtime-scanner-manifest-trace.cjs` checks the interface-first route syntax operation migration, parser consumption, the existing CLI/upstream contract trace, closed manifest judgment, explicit barrel exports, and the empty collections module. It passes 25/25 structural assertions.

Next recommendations:

1. Continue migrating the remaining exported runtime operations in scanner/route AST owner modules in coherent domain groups, with call-site changes in the same phase.
2. Keep new contract creation conditional on a documented gap in `packages/core/src/types/upstream`; do not add another manifest or scanner interface when an existing contract already covers the responsibility.
3. Continue preserving `complete | blocked` / accepted | rejected judgments and domain continuation operations at each AST, source-model, manifest, and projection boundary.
4. Audit barrel exports together with actual runtime consumers. A barrel entry alone is not evidence that the consumer uses the contract.
5. Run a supported repository TypeScript toolchain and the focused runtime tests before claiming type-level or end-to-end completion.

## Verification limits

The focused structural audits pass. A full `tsc --noEmit -p tsconfig.json` could not run successfully in this environment: the checked-in config targets `ES2025`, which the installed TypeScript 5.8.3 compiler rejects; local `node`/`vitest` type packages are absent because `node_modules` is not installed; and imported `packages/core/src/semantic/relations` source modules are missing from this workspace snapshot. Therefore this phase does not claim a successful full typecheck, build, runtime test, or E2E scan.
