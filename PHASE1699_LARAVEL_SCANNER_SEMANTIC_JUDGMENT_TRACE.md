# Phase 1699 — Laravel Scanner / Invocation Semantic Judgment Trace

## Scope

Trace the actual Phase 1698 source tree before changing wiring. This phase deliberately does not claim that the scanner interfaces are implemented by the legacy scanner classes. It records the concrete incompatibilities that must be closed by upstream semantic judgments before wiring can safely begin.

## Findings

### 1. The pipeline bypasses the scanner interfaces

`packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` directly calls `ModelScanner.scanCanonicalBundle`, `FormRequestScanner.scanCanonicalBundle`, `ControllerScanner.scanCanonicalBundle`, `ResourceScanner.scanCanonicalBundle`, `RouteScanner.scanCanonicalBundle`, and `ChannelScanner.scanCanonicalAsts`. The new `Laravel*ScannerInterface` contracts are exported but are not the dependency boundary used by this pipeline.

### 2. Route/controller contract mismatch

The route interface accepts `ControllerActionFlowContract[]`. The implementation's `RouteScanner.scanCanonicalBundle` instead accepts `RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>`. Controller scan currently produces both `actions` and that legacy index. The interface cannot be wired by simply passing `actions`; no verified semantic mapping from the public action contract back to the legacy index was found in this trace.

**Required next contract:** a source-backed route-controller binding judgment owned upstream, with explicit resolved/unresolved/ambiguous outcomes and provenance. Do not rebuild an index from AST or cast flow contracts to legacy action records inside the facade.

### 3. Resource/model/controller contract mismatch

The resource interface accepts model/controller AST arrays and controller action flow contracts. The implementation requires `ModelSymbolTable` and `Presence<ControllerResourceDataflow>`. `ControllerResourceDataflow` is derived from `ControllerActionInfo.dataflow.resourceBindings` by `extractResourceDataflow`.

**Required next contract:** a closed resource-model binding judgment derived upstream from model relation knowledge plus controller resource-binding evidence. Its status and unresolved obligations should be explicit; the runtime scanner must not silently infer or reclassify these facts.

### 4. Invocation semantic authority already exists

`invocationSemanticPipeline.analyzeKnowledge` delegates whole-knowledge analysis to `invocationSemanticRuntimeExecutor.executeAll(knowledge)`. `controllerDataflowAnalyzer` already calls `invocationSemanticPipeline.analyzeKnowledge(semanticKnowledgeDataFlow)`. Preserve this path. Laravel scanner work should supply source-backed knowledge and consume the validated judgment, not create a parallel invocation resolver or reconstruct judgment/proof data.

### 5. Model and FormRequest boundaries

`ModelScanner.scanCanonicalBundle(sourceProject, schema)` already matches the shape of `LaravelModelScannerInterface` closely. `FormRequestScanner` returns `sources`, `asts`, and `definitions`; Phase 1698 now represents those products in its judgment. These are the least problematic boundaries, but the pipeline still calls the concrete static methods rather than an injected interface.

## Recommended sequence

1. Define and validate route-controller binding judgment, including identity, provenance, and unresolved/ambiguous outcomes.
2. Define and validate resource-model/controller binding judgment from upstream knowledge.
3. Bind those judgments to explicit authorities/algebras; do not place semantic resolution in the scanner facade.
4. Implement scanner-interface adapters only after the contracts can be satisfied without casts or reclassification.
5. Inject/use interfaces from `laravelSourceAstPipeline`; migrate consumers one at a time.
6. Audit all references before emptying legacy files in-place.
7. Run typecheck, build, and ecommerce fixture end-to-end after dependencies are installed.

## External design references

- Laravel Controllers documentation: route declarations select controller actions; resource routing maps a resource declaration to a set of actions; nested/scoped resource routes add binding constraints. This supports keeping route, controller, and resource binding semantics explicit rather than collapsing them into one scanner. https://laravel.com/framework/docs/12.x/controllers
- Laravel Requests documentation: request injection and route parameters have separate semantics and order/identity constraints. https://laravel.com/framework/docs/12.x/requests
- MLIR Interfaces: analyses/transforms should consume generic interfaces rather than encode knowledge of each concrete operation implementation. https://mlir.llvm.org/docs/Interfaces/

## Verification

- The Phase 1699 trace audit checks actual source signatures and pipeline call sites; it is not a TypeScript build.
- Full build/typecheck remains unverified because prior workspace verification reported missing `tsdown` and ambient type packages.
- No wiring migration is claimed in this phase.
