# Phase 2831 — Route Dataflow Domain Operations and Manifest Trace

## Scope

This phase closes the exported operation surface in `packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts`. Seven exported arrow-function operations became private implementation functions owned by `RouteDataFlowOperationsInterface` and the frozen `routeDataFlowOperations` runtime object.

The existing `RouteDeclarationAst`, `RouteResourceDeclarationAst`, `RouteDeclarationFlow`, `RouteResourceFlow`, and `RouteDataFlowGraph` contracts are reused. No new generic reasoning primitive or replacement collection abstraction is introduced.

## Runtime application

`packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts` now calls `routeDataFlowOperations.declarationFlow(declaration)` inside `routeDeclarationEvidenceProjection.fromAst`. Target projection and binding projection consume the flow's typed facts, so this is wired into the active route declaration → producer-input → manifest construction path rather than being an isolated interface-only change.

## Manifest trace

```text
RouteDeclarationAst
  -> routeDataFlowOperations.declarationFlow
  -> routeDeclarationEvidenceProjection.fromAst
  -> routeDeclarationCompositionAuthority
  -> route producer input / route boundary composition
  -> Laravel source AST pipeline
  -> ManifestBuilderJudgment (manifest_builder_complete | manifest_builder_blocked)
  -> CLI manifest scan
  -> manifest projection continuation
  -> validation / serialization / persistence
```

The dataflow operation is a typed projection of existing AST facts. It does not replace the upstream route or manifest authority. `manifest_builder_blocked` and source-identity/discovery/inventory rejection outcomes remain distinct; this phase does not normalize failures into an empty manifest.

## Runtime export contract

```ts
export const routeDataFlowOperations: RouteDataFlowOperationsInterface = Object.freeze({
  declarationFlow: createRouteDeclarationFlow,
  declarationFlows: createRouteDeclarationDataFlow,
  resourceFlow: createRouteResourceFlow,
  resourceFlows: createRouteResourceDataFlow,
  declarationGraph: createRouteDeclarationDataFlowGraph,
  declarationGraphs: createRouteDataFlowGraph,
  resourceGraph: createRouteResourceDataFlowGraph,
});
```

`packages/core/src/types/upstream/collections.ts` remains empty (0 bytes), as required.

## Validation boundary

The structural audit verifies the interface-first surface and that the active route-composition consumer invokes the domain operation. This audit is not evidence of full TypeScript typecheck, package build, or CLI E2E success.
