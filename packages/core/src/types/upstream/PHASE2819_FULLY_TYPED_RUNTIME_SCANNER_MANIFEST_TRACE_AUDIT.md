# Phase 2819 — Fully Typed Runtime Scanner Operations: Upstream CLI Manifest Trace Audit

## Decision

Reuse the existing upstream contracts. This phase adds no parallel route-method, manifest, AST, trace, or generic reasoning contract. The existing CLI manifest operation, composition authority, manifest builder judgment, AST pipeline, and route-path domain-operated ADT already express the relevant boundaries.

## Runtime trace

```text
CLI scan/sync command
  -> RouteSyncCliUpstreamCompositionInterface
  -> composition.manifestScanOperation.scan(input)
  -> RouteSyncCliManifestScanOperationInterface
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> source-project identity / source discovery / source-document binding
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> source AST judgment (complete | blocked)
  -> source-model construction judgment (complete | blocked)
  -> SemanticDataflowManifestSurfaceInterface
  -> ManifestBuilderJudgment (manifest_builder_complete | manifest_builder_blocked)
  -> CLI projections and request-resolution preflight
  -> manifest projection / validation / serialization / persistence
```

Route-path subtrace:

```text
route declaration parser
  -> routePathTokenAcceptanceOperation.accepts(cursor, method)
  -> routePathTokenFactFactory.create(cursor, method)
  -> routePathTokenExpectation(method) [closed LaravelRouteMethod switch]
  -> RoutePathTokenFact.continueForAcceptance(continuation)
  -> parser accepts/rejects the route-path token
```

## Interface-first rule

Public runtime operations on this path use explicit interface-typed frozen objects:

```ts
export interface ExampleOperationInterface {
  readonly run: (input: ExistingDomainInput) => ExistingDomainJudgment;
}

export const exampleOperation: ExampleOperationInterface = Object.freeze({
  run: (input: ExistingDomainInput): ExistingDomainJudgment => existingDomainAuthority.judge(input),
});
```

This is a shape example, not a proposed additional contract. Existing operations should be reused or evolved. Convert a reachable exported function or bare arrow export only after its owner contract and every call site have been identified. Pure constructors and unrelated helpers must not be mechanically wrapped just to satisfy a textual pattern.

## ADT and runtime boundaries

- `RoutePathTokenFact` retains `method`, `expectation`, and `actual`, and exposes `continueForAcceptance` as a domain operation.
- `ManifestBuilderJudgment` preserves complete and blocked outcomes.
- AST failure remains a typed blocked judgment; it must never be converted into a valid empty manifest.
- Runtime operations perform deterministic domain operations only. They do not invent semantic reasoning or promote a recommendation into runtime evidence.
- Trace evidence records executed stages and observed results. Suggestions are audit recommendations, not scanner facts. Manifest publication is permitted only after the existing complete/validation path succeeds.
- `packages/core/src/types/upstream/collections.ts` remains zero bytes.

## Findings

1. The CLI manifest scan factory is already `RouteSyncCliManifestScanOperationFactoryInterface`-typed and frozen.
2. CLI composition already invokes `requestTypeDerivationProductionPipelineAssembler.assemble(...)` through the existing operation object and preserves the `rejected` versus `assembled` result.
3. The manifest composition authority, manifest builder judgment, and AST pipeline contracts already exist and should remain authoritative.
4. The route-path-specific policy no longer uses the generic catalog/relation lookup path; its ADT exposes a continuation operation.
5. `semanticRouteSyntaxRelations.ts` still exports other parser operations as bare function-valued constants and uses relation utilities for separate responsibilities (route method catalog lookup, constraints, route groups, and target resolution). These are outside the already-migrated route-path policy slice. Each needs a separate owner/call-site audit before migration; this phase does not claim global relation utility removal.

## Acceptance and verification boundary

The accompanying `audit:phase2819-fully-typed-runtime-scanner-manifest-trace` script asserts the source-level contracts and trace. It does not establish TypeScript compilation, production build, complete test suite, or CLI scan/sync end-to-end behavior. Those must be run separately in an environment with the workspace dependencies installed.


## Phase 2819 follow-up: public barrel contract gap

The CLI already owned `ControllerInvocationManifestCompositionAuthorityInterface`, its typed input, dependency bundle, and reasoning contract, but `packages/cli/src/index.ts` exported only the builder and factory interfaces. That made the authority contract less discoverable/reusable through the package's public surface. The barrel now explicitly exports the existing authority, input, dependency bundle, and reasoning contract; no duplicate contract was introduced. The Phase 2819 structural audit includes a regression check for these named exports.
