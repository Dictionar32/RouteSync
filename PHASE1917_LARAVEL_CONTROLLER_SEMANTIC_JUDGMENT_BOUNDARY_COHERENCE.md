# Phase 1917 — Laravel Controller Semantic-Judgment Boundary Coherence

## Trace findings

The Phase 1916 trace shows `canonicalDefinition` uses two intentionally distinct authorities: `PhpAstExpressionSemanticAuthorityInterface.derive` projects PHP expression evidence into the source-facing upstream `Expression`, while `ControllerVariableSemanticRuntimeExecutorInterface.execute` returns the closed `ControllerVariableSemanticJudgment`. The `ControllerVariableDefinition` stores both. They are not interchangeable: the judgment's `expressionValue` belongs to the semantic-value vocabulary, while `expression` is the canonical source-expression projection.

The scanner boundary contract also had a version mismatch: its interface declared version 81 while its exported contract value was version 82. Phase 1917 aligns both to version 83 and adds an explicit invariant for exact semantic-judgment retention.

## Change

- Align `LaravelControllerInvocationSemanticBoundaryContract.version` and the exported contract object's `version` at 83.
- Add `controllerDataflowSemanticResolutionJudgmentBoundary` to state that the exact judgment returned by the existing executor is retained in each definition, without reconstruction or reclassification.
- Document in `controllerDataflowAnalyzer.ts` that the projected `Expression` and judgment `expressionValue` remain distinct domain representations.
- Do not create a duplicate semantic authority, and do not change invocation judgment or integrated-response composition.

## Invocation provenance invariant

The analyzer continues to pass `judgment.response` unchanged into integrated response composition and returns both `invocationJudgment: judgment` and `invocationSemanticIntegratedResponse`. These remain distinct canonical values.

## Remaining migration

The analyzer still orchestrates the ordered calls to correspondence, identity, expression projection, semantic execution, and variable-flow composition. This phase does not claim it is wiring-only and does not move orchestration functions into `types/upstream`. Build, typecheck, and unit tests were not run.
