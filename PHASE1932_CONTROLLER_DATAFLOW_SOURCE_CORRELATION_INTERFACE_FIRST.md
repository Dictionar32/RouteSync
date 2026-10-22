# Phase 1932 — Controller Dataflow Source Correlation (Interface First)

## Trace finding

`controllerDataflowAnalyzer.ts` already receives the closed `LaravelControllerInvocationSemanticJudgmentInterface`. Before this phase, the analyzer independently read `judgment.sourceFile` at the knowledge-projection call and at the source-payload evidence call. Both reads referred to the same value in practice, but the source-correlation invariant was implicit in repeated access rather than made explicit at the scanner boundary.

## Interface-first correction

- Bind `judgment.sourceFile` once as the canonical source subject before collecting either evidence family.
- Forward that exact domain value to both `SemanticKnowledgeEvidenceAdapter.project` and `ControllerDataflowSourcePayloadEvidenceAdapter.collect`.
- Extend the existing `ControllerDataflowSemanticJudgmentAuthorityContract` to version 6 with a typed source-correlation rule; do not create a parallel authority or use `semantic/foundation`.
- Advance the existing controller dataflow semantic model contract to version 5 to state that the canonical invocation judgment owns source identity and no path-based reconstruction is allowed.
- Advance the existing Laravel controller boundary contract to version 94 and document the shared source-subject rule.
- Update the Phase 1931 audit for the authority version and add the Phase 1932 targeted audit.

## Scope / limits

This closes the production construction path by making one source subject explicit. It does not claim TypeScript can prove equality between arbitrary independently forged `SourceFile` values; the boundary is guaranteed by the analyzer's construction path, and future callers of the authority must preserve the same contract.

## Verification

The Phase 1932 audit is a static contract/source audit. The Phase 1931 and Phase 1930 audits are run separately. No package build or TypeScript compilation is claimed.
