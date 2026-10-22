# Phase 1740 — Integrated Response Composition Interface

## Trace finding

Phase 1739 already has the canonical `InvocationSemanticJudgment` discriminated union, `InvocationSemanticAnalysis`, `InvocationSemanticPipelineInterface`, `InvocationSemanticSubjectCoverageInventoryInterface`, `InvocationSemanticCoveragePublicationInterface`, and `InvocationSemanticIntegratedResponse` result union. Adding another integrated-response *authority* would duplicate publication correspondence ownership.

The concrete gap is composition: there is no interface contract expressing that inventory and analysis must be derived from the same `SemanticKnowledgeDataFlow`, then passed together to the existing publication authority, and finally projected into the existing accepted/rejected response union.

## Interface-first change

- Added `InvocationSemanticIntegratedResponseCompositionContract` v1.
- Added `InvocationSemanticIntegratedResponseCompositionInput`, containing one canonical `knowledge` input only.
- Added `InvocationSemanticIntegratedResponseCompositionInterface`, explicitly reusing the existing pipeline, inventory, and publication interfaces.
- Evolved `InvocationSemanticPipelineContract` v48 → v49 to reference the composition contract.
- Evolved `LaravelControllerInvocationSemanticBoundaryContract` v27 → v28 to state that scanner consumes a composed response only after upstream composition exists.
- Exported the new contract/interface/input from `packages/core/src/index.ts`.
- Added direct and regression audit scripts.

## Explicit non-goals

- No second semantic/publication authority was added.
- No correspondence validation was copied into composition or scanner.
- No production composition implementation or Laravel wiring was added.
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts` remains unchanged and delegates to `invocationSemanticPipeline.analyzeKnowledge(...)`.
- No dependency on `core/src/semantic/foundation` was introduced.
- No full package build was run.

## Validation

Run `node scripts/audits/audit-phase1740-integrated-response-composition-interface.cjs` and `node scripts/audits/audit-phase1740-interface-regression.cjs` from the repository root. The direct audit verifies interface ownership, single-knowledge input, output union, exports, scanner scope, and truthful implementation status.
