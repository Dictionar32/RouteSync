# RouteSync Phase 2388 — Manifest Semantic Operation Closure

## Scope

Continue the upstream manifest path from Phase2387. The objective is to make operations that derive manifest products explicit through existing upstream contracts, without adding duplicate interface families or pushing semantic composition to runtime.

## Trace and root cause

The previous manifest builder exposed its source-AST pipeline after Phase2387, but the implementation still performed two product-producing operations directly in `constructRouteSyncManifest`:

1. It enumerated semantic dataflow judgments and materialized query-policy contracts through a local helper that directly called `materializeSemanticDataflowQueryPolicy`.
2. It derived resource-group capabilities through the function adapter `resourceGroupCapabilitiesFromRoutes` instead of expressing the existing algebra operation as a builder dependency.

Those were hidden operations in the manifest execution path. They were not missing concepts: the existing `SemanticDataflowManifestSurfaceInterface` and `ResourceGroupCapabilityAlgebraInterface` already owned the correct boundaries.

## Changes

- Advanced the existing `ManifestBuilderInterface` contract version from 5 to 6.
- Made three existing operations explicit builder dependencies: `LaravelSourceAstPipelineInterface`, `SemanticDataflowManifestSurfaceInterface`, and `ResourceGroupCapabilityAlgebraInterface`.
- Evolved `SemanticDataflowManifestSurfaceInterface` with `queryPolicyContractsFromJudgments`, so query-policy materialization is owned by the same upstream surface that produces seed inputs and semantic judgments.
- Changed manifest construction to delegate query-policy materialization through `dataflowManifestSurface` and resource-group capability composition through `resourceGroupCapabilityAlgebra.compose`.
- Wired the canonical builder at the composition root to the existing `laravelSourceAstPipeline`, `semanticDataflowManifestSurface`, and `resourceGroupCapabilityAuthority`.
- Kept the typed source-AST blocked judgment gate ahead of all semantic manifest-product operations.
- Added no duplicate manifest/capability interface and no `semantic/foundation` dependency.

## Current path

`CLI composition → ManifestBuilderInterface.build(ManifestBuilderInput) → LaravelSourceAstPipelineInterface.execute → LaravelSourceAstProjectionJudgment → CompleteSourceAst gate → source-model construction → SemanticDataflowManifestSurfaceInterface (inputs, judgments, query-policy contracts) + ResourceGroupCapabilityAlgebraInterface.compose → ManifestBuilderJudgment → CLI presentation`

The path is more explicit, but it is not yet fully closed: `buildCompleteLaravelSourceModel` remains a direct function call rather than an injected operation contract, and CLI end-to-end execution has not been verified.

## Verification evidence

Structural audits executed successfully:

- Phase2380 route closure: 8/8
- Phase2381 evidence authority flow: 8/8
- Phase2382 canonical contract reuse: 14/14
- Phase2383 route boundary executor integration: 8/8
- Phase2384 boundary projection: 8/8
- Phase2385 legacy route scanner retirement audit: 6/6
- Phase2385 route emission consumer inventory: 6/6
- Phase2386 direct route boundary operation: 8/8
- Phase2387 manifest operation injection (updated for v6): 12/12
- Phase2388 manifest semantic operations: 10/10

Total: 88 structural assertions passed. TypeScript syntax parsing passed for the three changed TypeScript files. A targeted compiler invocation produced no diagnostics naming the three changed files, but the wider compilation emitted numerous unrelated/pre-existing repository errors (including missing Node type declarations and type errors in scanner modules). Package build, Vitest, and real CLI scan/sync were not run. These checks do not establish full typecheck or end-to-end correctness.

## Remaining work

1. Model or reuse an appropriate existing upstream operation contract for `buildCompleteLaravelSourceModel`; do not add a wrapper solely to relocate the function.
2. Trace the resulting `ManifestBuilderJudgment` through CLI presentation and verify all blocker arms preserve their original semantic judgments.
3. Return to the route path: active `subscanners/route-scanner` and `subscanners/routeProducerRelations` dependencies remain, as does scanner-owned method-judgment dispatch.
4. Run project-supported typecheck/tests and an actual CLI scan/sync in a supported environment before declaring end-to-end closure.
