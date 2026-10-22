# Phase 2192 — Interface-first dataflow datum pipeline

## Scope

Evolve the existing semantic-dataflow interfaces so datum creation, source-model projection, manifest handoff, and runtime execution depend on explicit upstream contracts. No new relation/foundation/subscanner reasoning layer is introduced.

## Trace

`Laravel source model / scanner semantic knowledge`
→ `SemanticDataflowRouteProjectionAuthorityInterface`
→ `SemanticDataflowControllerProjectionAuthorityInterface`
→ `SemanticDataflowControllerQueryProjectionAuthorityInterface`
→ `SemanticDataflowRequestProjectionAuthorityInterface`
→ `SemanticDataflowInputProducerInterface / SemanticDataflowSeedProducerInterface`
→ `SemanticDataflowManifestSurfaceInterface`
→ `SemanticDataflowReasoningAuthorityInterface`
→ `SemanticDataflowJudgmentBoundaryInterface`
→ `SemanticDataflowRuntimeExecutorInterface`
→ downstream AST / IR projection.

The four projection authorities remain distinct because they carry different source evidence and lineage ownership; the producer composes them into the canonical controller-scoped datum without reclassifying their semantics.

## Changes

- Added an authority interface and default authority value for route, controller/resource, controller query, and request/FormRequest dataflow projections.
- Added `createSemanticDataflowInputProducer`, which accepts the projection authority set through interfaces instead of importing the four projection functions as direct calls.
- Added `SemanticDataflowManifestSurfaceInterface` and `createSemanticDataflowManifestSurface`, with the seed producer and reasoning authority injected by contract.
- Updated the scanner manifest builder to consume the manifest-surface interface instance rather than separately invoking free functions.
- Added `createSemanticDataflowRuntimeExecutor`, injecting the existing reasoning authority and judgment admission boundary. The runtime executor still delegates reasoning and validates the already-derived proof envelope; it does not infer or repair judgments.
- Added public exports for the new authority and factory contracts.
- Added a producer-injected `SemanticDataflowInputAdapterInterface` for scanner knowledge conversion; controller AST wiring now consumes the interface instance rather than importing the concrete adapter function.

## Explicit boundaries / remaining work

- The scanner adapter still converts its local `SemanticKnowledgeDataFlow` representation into upstream evidence. Its conversion is a source-format adapter, not the canonical semantic-dataflow authority. A later migration may make the scanner's producer kind a closed ADT if the upstream source model can provide equivalent producer evidence without loss.
- Default instances remain as composition-root compatibility exports. Consumers needing test isolation or alternative implementations can use the factory functions and interface contracts.
- The broader repository typecheck/build and Vitest suite were not run in this environment. Syntax transpilation passed for all eight changed TypeScript modules. A targeted strict `tsc` attempt surfaced numerous existing repository errors, including known errors in `packages/core/src/index.ts` and pre-existing AST/type-shape errors in `controllerAstCanonical.ts`; no diagnostics were reported for the changed upstream dataflow implementation modules or the scanner adapter itself. The project-wide typecheck therefore remains unverified.
