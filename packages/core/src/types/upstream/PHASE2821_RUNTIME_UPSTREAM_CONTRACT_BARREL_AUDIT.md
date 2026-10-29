# Phase 2821 — Runtime Upstream Contract Barrel Audit

## Objective

Make existing scanner/controller/request contracts discoverable through the canonical `packages/core/src/types/upstream/index.ts` barrel, and re-verify the CLI manifest runtime path against its existing interface-first operations and domain ADTs.

## Changes applied

Added explicit type exports for existing declarations in:

- `controllerProducerInterface.ts`
- `controllerRuntimeReturnProjectionInterface.ts`
- `laravelControllerInvocationResponseWiringInterface.ts`
- `laravelControllerRequestSemanticBindingInterface.ts`
- `requestProducerInterface.ts`
- `semanticKnowledgeEvidenceAdapterInterface.ts`
- `typeInternerInterface.ts`
- `controllerActionResponseReferenceJudgmentInterface.ts`

The Phase 2820 explicit exports remain in place for `routeConstraints.ts`, `controllerDependencySemanticJudgmentInterface.ts`, and `controllerReturnSemanticProductionInterface.ts`. The Phase 2819 CLI barrel exports remain in place for `ControllerInvocationManifestCompositionAuthorityInterface`, its input, dependencies, and reasoning contract.

No duplicate authority or parallel generic reasoning contract was introduced. The runtime implementation modules continue to depend on the owner contracts directly; the barrel is a stable public import surface, not a reason for internal modules to import back through `index.ts` and create cycles.

## Runtime trace audited

```text
CLI scan/sync
  -> RouteSyncCliUpstreamCompositionInterface
  -> RouteSyncCliManifestScanOperationInterface.scan(input)
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> source AST complete | blocked
  -> source-model complete | blocked
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment complete | blocked
  -> projection / validation / serialization / persistence
```

Route-path handling remains a separate typed subtrace. `RoutePathTokenFact.continueForAcceptance` owns the domain continuation and `routePathTokenExpectation` is a closed switch over the existing `LaravelRouteMethod` contract.

## ADT / trace rules

- Complete and blocked manifest outcomes remain distinct.
- AST failure is never promoted into a valid empty manifest.
- ADTs must own domain operations for consuming their result; they are not passive payload-only records.
- Trace facts describe executed stages and observed outcomes. Audit suggestions remain recommendations, never runtime evidence.
- Runtime operations do not introduce a primitive reasoning fallback.
- `packages/core/src/types/upstream/collections.ts` remains exactly zero bytes.

## Remaining inventory

The Phase 2820 structural inventory now reports 41 source modules that define exports but have no direct module entry in the upstream barrel, down from 49 after the selected contract additions. **This is an inventory, not a mandate to export every file.** It also sees implementation authorities, helper vocabularies, and internal adapters. Each remaining file needs ownership and consumer tracing before a decision to expose it. The next audit should prioritize contracts used by the CLI manifest's reachable controller/request/route path, and should only add public exports where the type is intended to be part of the upstream contract.

The broad conversion of every exported arrow/function in all scanner modules is not complete. The route-path acceptance slice and CLI manifest boundary are interface-first, but other parser helpers and relation-based responsibilities still need a domain-by-domain owner/call-site migration. Do not mechanically wrap unrelated pure constructors or generic utilities.

## Verification

- `audit:phase2820-upstream-barrel-export-gaps`: 11/11 targeted contract-module checks; 41 residual inventory entries; `collections.ts` = 0 bytes.
- `audit:phase2821-runtime-upstream-contract-barrel`: 11/11 structural checks passed.
- `audit:phase2818-route-path-policy-direct-adt`: 12/12 passed.
- `audit:phase2804-cli-manifest-interface-runtime`: 11/11 passed.

These are structural source assertions only. TypeScript typecheck, production build, full test suite, and CLI scan/sync end-to-end have not been run because dependencies are not installed in this workspace.
