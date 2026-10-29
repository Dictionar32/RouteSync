# Phase 1546 — Interface-First Scanner Dependency Inversion

## Objective

Make the existing upstream runtime contract the scanner's dependency boundary. This phase deliberately does not change semantic reasoning rules or introduce another solver.

## Trace findings

- `types/upstream/semanticDataflowInterface.ts` owns the public runtime and admission contracts.
- `types/upstream/semanticDataflowAdmission.ts` implements admission validation.
- `types/upstream/semanticDataflowRuntimeExecutor.ts` is the composition point for the existing reasoning authority and admission implementation.
- Before this phase, `frontend/php/routeAst/semanticDataFlowAnalyzer.ts` imported the concrete executor directly and synthesized a `scope`/`semantic-knowledge` identity while adapting evidence.
- The scanner analyzer is now a factory over `SemanticDataflowRuntimeExecutorInterface` and has no dependency on the concrete executor singleton.
- `scanner/wiring/semanticDataflowRuntimeBinding.ts` is the production composition root that binds the concrete upstream executor to the interface-driven analyzer.
- `scanner/wiring/semanticDataflowInputAdapter.ts` now owns the mapping from source knowledge to the closed request algebra and reuses an existing source identity rather than inventing a synthetic semantic scope identity.

## Contract path

`SemanticKnowledgeDataFlow → scanner evidence adapter → SemanticDataflowRuntimeExecutionRequest → SemanticDataflowRuntimeExecutorInterface → runtime executor → accepted judgment/rejection or no-evidence outcome → compatibility projection`.

The scanner analyzer only interprets protocol outcomes and maps canonical paths to the legacy compatibility projection. It does not choose the authority or compose reasoning with admission.

## Verification

Run `npm run audit:phase1546-interface-first-scanner-dependency-inversion`.

This is a static architecture audit. It does not claim that the full build or Vitest suite passed. Full build/type-check requires the repository's declared TypeScript 7.0.2 and `tsdown` 0.22.14 dependencies.

## Scope boundary discovered by wider scanner trace

The repository-wide scanner trace also finds `compiler/frontend/php/controllerDataflowAnalyzer.ts`, where `solveSemanticCandidate()` still selects controller variable semantics inside scanner code. The current `semanticDataFlowAnalyzer.ts` path has no non-test production imports in the source search, so this phase must not be described as a completed migration of the whole scanner runtime. The controller-variable semantic path is a separate, concrete interface-first migration frontier: define its upstream evidence/request/result contract first, then inject it into the scanner, and only afterward move the implementation behind that contract.
