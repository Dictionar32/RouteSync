# Phase 1744 — Source-Bound Composition Result Interface

## Trace findings

Phase 1743 already defined the integrated response composition interface, but its return type was only `InvocationSemanticIntegratedResponse`. That response retained the publication result and its analysis binding, but it did not retain the exact `SemanticKnowledgeDataFlow` input at the composition boundary. A downstream consumer could therefore receive a response without the source graph that the composition operation was asked to process.

This is an interface-model gap, not a reason to add another semantic authority. The existing pipeline owns analysis, the inventory owns canonical source-subject discovery, and the publication authority remains the sole owner of correspondence validation.

## Interface-first changes

- Added `InvocationSemanticIntegratedResponseCompositionResult`, which carries the exact `knowledge` input beside the publication-derived `response`.
- Evolved `InvocationSemanticIntegratedResponseCompositionInterface.integrate` to return the source-bound composition result.
- Evolved composition contract v2 → v3 to state the source-binding invariant.
- Evolved `InvocationSemanticPipelineContract` v52 → v53 and `LaravelControllerInvocationSemanticBoundaryContract` v31 → v32.
- Added source-binding declarations to the pipeline and Laravel scanner boundaries.
- Exported the result type from `packages/core/src/index.ts`.
- Did not add a second publication/integrated-response authority, did not wire the scanner, and did not introduce a `semantic/foundation` dependency.

## Runtime status

`controllerDataflowAnalyzer.ts` remains unchanged and still calls `invocationSemanticPipeline.analyzeKnowledge(semanticKnowledgeDataFlow)`. Composition implementation and Laravel wiring are still pending. The new interface describes the required output shape; it does not prove object identity or runtime correctness until an implementation is supplied and behaviorally tested.

## Verification

- Phase 1744 interface audit: 18 checks.
- Phase 1744 regression audit: 5 checks.
- No package build was run.
- No project-wide typecheck pass is claimed.

## Design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- TypeScript Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript Unions and Intersection Types: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
