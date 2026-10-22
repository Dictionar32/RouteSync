# Phase 1878 — Laravel Integrated Response Parser Contract (Interface First)

## Trace

Canonical flow: `LaravelControllerInvocationSemanticJudgmentInterface.response` → `LaravelSourceLexer.parseControllerDeclarationFromInvocationJudgment` → `parseControllerMethod` → `parseControllerBody` → `analyzeControllerDataflowWithIntegratedResponse` → `createControllerDataflowAnalyzer` → upstream `invocationSemanticIntegratedResponseComposition`.

The canonical scanner passes the complete `LaravelControllerInvocationSemanticJudgmentInterface` into `parseControllerDeclarationFromInvocationJudgment`. That parser entry derives both the file path and integrated response from the same judgment, so the scanner cannot accidentally pass a path from one source with a response from another. The parser path previously named this closed response `pipelineEvidence` and typed it as `InvocationPhpSourcePipelineInput`, which incorrectly suggested raw or pre-integration evidence remained at the parser boundary.

## Interface-first correction

- Replaced `InvocationPhpSourcePipelineInput` with the canonical `InvocationPhpSourceIntegratedResponse` type alias, whose underlying type is `PhpSourceInvocationSemanticPipelineIntegrationResult`.
- Renamed parser/dataflow parameters to `integratedResponse` and the wiring entry point to `analyzeControllerDataflowWithIntegratedResponse`.
- Added `parserIntegratedResponseBoundary` to the upstream Laravel controller semantic boundary contract and advanced it to v50.
- Updated regression audit expectations and registered a focused Phase 1878 audit.

## Invariants

- The parser consumes only the closed integrated response, not raw pipeline evidence.
- The canonical scanner does not reconstruct, branch on, or reclassify the response.
- The four outcomes `not_connected`, `source_binding_rejected`, `complete`, and `blocked` remain distinct.
- No `semantic/foundation` dependency was added.

## Verification limits

Focused static audits and syntax checks are run for this phase. Full build and TypeScript compilation are intentionally not run in this environment.
