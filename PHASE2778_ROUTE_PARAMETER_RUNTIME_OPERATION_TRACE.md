# Phase 2778 — Fully Typed Runtime Scanner / Route Capability Operation Trace

## Change applied

The route-parameter capability API is now exposed through `RouteParameterCapabilityOperationsInterface` and the frozen runtime object `routeParameterCapabilityOperations`. The five former exported function declarations in `packages/core/src/types/upstream/routeParameterCapability.ts` are private implementation constants. `packages/core/src/index.ts` exports the object and its interface, and the CLI SDK API emitter calls the object directly.

## Runtime trace

```text
Laravel route scan / RouteSemanticFlow
  -> route identity parameters
  -> routeParameterCapabilityOperations
       -> targetScopeFromRoute
       -> fromRoute
       -> referenceFromCapability
       -> referencesFromRoute / referenceFromRoute
  -> packages/cli/src/generators/sdk/apiObjectEmitter.ts
       -> emits targetScope, routeParameter, routeParameters
  -> generated SDK API object
```

The broader manifest route is:

```text
laravelSourceAstPipelineFactory.create(...).execute()
  -> LaravelSourceAstProjectionJudgment (complete | blocked)
  -> manifestBuilderOperationPreparation.prepare(...).build()
  -> complete source model + semantic dataflow + route capability composition
  -> routeManifestProjectionInputs / routeSyncManifestLoweringOperations
  -> CLI manifest validation / serialization
```

## Explicit ADT boundary

`LaravelSourceAstProjectionJudgment` already differentiates complete and blocked projection outcomes. `SourceScanJudgment` defines a richer scan-level ADT with typed stage, project identity, block reason and completion witnesses, but it is **not yet wired into the source-AST pipeline**. The next migration should map each existing blocker variant to a concrete `SourceScanBlockReason` without collapsing blocked outcomes into empty results.

## Collection status

`packages/core/src/types/upstream/collections.ts` remains 0 bytes as requested. This is not a successful full-repository migration: `completeness.ts`, `ast.ts`, `highLevelSourceModel.ts`, and other consumers still import collection contracts. The source inventory shows that those dependencies must be removed by domain-owned contracts and traversal changes, not by restoring `Sequence<T>` or adding a new generic collection wrapper.

## Remaining exported function declarations

After this change, the route-parameter capability module has no `export function` declarations. Other declarations remain in `domainIntentCapability.ts`, `laravelControllerResponseSemanticPipeline.ts`, `operationIdentityCapabilityAuthority.ts`, `resourceGroupCapabilityAuthority.ts`, `routeCapabilityAuthority.ts`, `routeCapabilitySemanticAuthority.ts`, `routeSecurityAuthority.ts`, `semanticDataflowKnowledge.ts`, `semanticMapping.ts`, and `semanticTypedRelation.ts`. Prioritize operations used directly on the scanner-to-manifest path; do not mechanically convert overloads or generic helpers without preserving their call contracts.

## Audit and verification

Run:

```bash
npm run audit:phase2778-route-parameter-runtime-operation
```

This audit checks the operation interface, public barrel, actual CLI consumer and the still-unwired scan ADT boundary. It is a structural audit, not a substitute for TypeScript typecheck or CLI end-to-end tests.
