# Phase 1746 — Interface-First Integrated Response Authorities and Laravel Scanner

## Objective

Complete the existing upstream interfaces before scanner delegation: implement the source-subject inventory authority and the inventory-bound publication authority, then connect Laravel controller dataflow through the single integrated-response composition interface.

## Source trace

- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` defines the canonical subject, inventory, publication, typed violation ledger, validation receipt, integrated response, and composition contracts.
- `packages/core/src/types/upstream/invocationSemanticCoverageInventory.ts` implements the existing inventory interface from canonical `SemanticKnowledgeDataFlow.facts`.
- `packages/core/src/types/upstream/invocationSemanticCoveragePublicationAuthority.ts` implements the existing publication interface. It validates inventory identity uniqueness, analysis identity membership, duplicate judgments, source evidence, and preserves typed rejections. It does not derive semantic judgments.
- `packages/core/src/types/upstream/invocationSemanticPipeline.ts` composes the inventory, semantic pipeline, and publication authority through the already-defined dependency contract.
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts` now invokes only `invocationSemanticIntegratedResponseComposition.integrate(...)` for invocation semantics and retains the source-bound result in `ControllerDataflowAst`.

## Result

- Ordinary and static invocation source facts are inventoried from the same knowledge graph used for analysis.
- Static invocations remain explicitly uncovered; no static judgment is fabricated.
- A validated publication receipt owns the exact analysis object and the correspondence ledger.
- A rejected publication retains the exact analysis object and a non-empty typed violation ledger.
- The scanner preserves the integrated result and projects the legacy `invocationSemanticAnalysis` view from the exact validated receipt or rejection. It does not call inventory/publication authorities directly or reconstruct semantic meaning.
- The `core/src/semantic/foundation` layer is not used.

## Verification status

`npm run audit:phase1746-integrated-response-authorities-and-scanner` passes 32/32 static source-contract checks. TypeScript transpile/syntax checks pass for all eight changed TypeScript files. A focused no-emit TypeScript check was attempted with the globally available TypeScript 5.8 compiler, but the extracted workspace lacks its local dependencies and the transitive project graph reports 925 unrelated diagnostics; none of the changed implementation/scanner files appeared in the filtered diagnostics. Therefore a clean project typecheck is not claimed. Package build was not run.
