# Phase 2222 — Canonical Action / Integrated Response Source Correlation

## Finding

The integrated response pipeline already produces method-scoped response products carrying the canonical method return semantic and exact method source span. The response scanner previously projected each product into a `ResponseAst` without requiring a match against the controller artifact's canonical `ControllerActionJudgmentPublication` inventory. This left the response product's action identity and source provenance adjacent to, but not explicitly correlated with, the published action judgment at the projection boundary.

## Change

The existing `LaravelControllerMethodResponseAstProjectionInterface` is evolved rather than adding another authority. Its input now receives canonical action publications from the same controller artifact. Before output-type projection or `ResponseAst` construction, the existing upstream projection contract correlates the response product against the canonical action name and exact source file/start/end span.

The result is a closed union:

- `controller_method_response_ast_projection_complete` carries the exact matched action publication.
- `controller_method_response_action_correlation_rejected` preserves the response product, candidate publications, and a typed reason for missing or ambiguous correlation.

`responseScanner.ts` forwards the complete action publication inventory. It emits `ResponseDefinition` and `ResponseAst` only from complete projection judgments; rejected correlations remain available in `projectionJudgments` and are not silently converted to an AST.

## Architecture boundary

No `semantic/foundation`, replacement relation layer, subscanner, or parallel response authority was added. The existing `LaravelControllerResponseSemanticPipelineInterface` remains the owner of integrated response semantics and method response AST projection. The scanner only supplies the canonical action publications already present on its artifact.

This closes response-product-to-action-publication correlation at AST projection. It does **not** retire `resolveControllerActionContract()` / `resolveResponse()`, and does not claim legacy response descriptor parity or resource-binding publication closure.

## Validation

- TypeScript syntax transpilation: changed source files checked for syntax diagnostics.
- Structural regression assertions added in `response-action-source-correlation.phase2222.test.ts`.
- Full Vitest, full typecheck, and package build are not claimed as run.
