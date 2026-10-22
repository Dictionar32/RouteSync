# Phase 1922 — Existing controller semantic model owns projection provenance

## Trace result

The existing upstream `ControllerDataflowInvocationSemanticModelInterface` already owned the final semantic values: `semanticKnowledgeDataFlow`, the canonical `invocationJudgment`, and the separate `invocationSemanticIntegratedResponse`. It did not yet own the source-correlated `semanticKnowledgeProjection`, which remained declared only on `ControllerDataflowAst`.

The PHP evidence transformation remains a genuinely different responsibility: `SemanticKnowledgeEvidenceAdapter<TEvidence>` describes how evidence becomes a canonical knowledge projection. The value model cannot replace that transformation contract. The trace did not justify deleting the adapter contract; it justified removing duplicate ownership of its result.

## Changes

- Added `semanticKnowledgeProjection` to `ControllerDataflowInvocationSemanticModelInterface` so source identity and provider provenance are part of the existing upstream semantic value model.
- Removed the duplicate projection property from `ControllerDataflowAst`; the AST now inherits it from the upstream model.
- Added an explicit ownership rule to the existing model contract.
- Added the same ownership statement to `LaravelControllerScannerInterface` and advanced its declared/runtime boundary version from 87 to 88.
- Updated the Phase 1921 audit expectation to reflect the new canonical owner.
- Added `scripts/audits/audit-phase1922-controller-semantic-model-ownership.cjs`.

## Preserved invariants

- `invocationJudgment` remains the exact `LaravelControllerInvocationSemanticJudgmentInterface` value.
- `invocationSemanticIntegratedResponse` remains a separate composition result.
- The analyzer composes the response using the knowledge projection's exact knowledge and the canonical judgment's response.
- PHP-specific provider provenance remains owned by the PHP projector, not synthesized by the analyzer.
- No second callable invocation authority or parallel semantic model was introduced.

## Validation

The Phase 1921 static audit passes 9/9 checks and the Phase 1922 static audit passes 10/10 checks. ZIP integrity was checked after packaging. No TypeScript build, typecheck, or runtime test suite was run.
