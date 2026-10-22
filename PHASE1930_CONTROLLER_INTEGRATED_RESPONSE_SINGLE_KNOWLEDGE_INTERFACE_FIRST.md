# Phase1930 — Controller Integrated Response: Single Knowledge Interface First

## Trace finding

Phase1929 removed the duplicate top-level `semanticKnowledgeDataFlow` field from the controller model, but `InvocationSemanticIntegratedResponseCompositionResult` still exposed the same graph again as `invocationSemanticIntegratedResponse.knowledge`. That made the contract's “single canonical knowledge field” claim incomplete: the same knowledge value was published twice at different paths even though the implementation passed the same object into inventory and invocation analysis.

## Interface-first correction

- Evolved the existing `InvocationSemanticIntegratedResponseCompositionResult` contract to publish only `response`; the composition executor still feeds the exact same `input.knowledge` to both inventory and invocation analysis before publication.
- Kept canonical knowledge and evidence-provider provenance on `semanticKnowledgeProjection` in the controller model.
- Preserved `invocationJudgment` and `invocationSemanticIntegratedResponse` as distinct typed values. The exact `invocationJudgment.response` remains the PHP invocation outcome forwarded into composition.
- Updated composition contract to v19, the containing invocation pipeline contract to v58, controller model contract to v4, controller dataflow judgment authority contract to v4, and Laravel controller boundary contract to v92.
- Added `audit:phase1930-controller-integrated-response-single-knowledge-interface-first`.
- Updated the Phase1929 audit to assert the current evolved contract versions.

## Verification

The Phase1930 static audit is intended to verify the public shape, single knowledge publication, same-input composition order, version coherence, and retained judgment/response separation. This phase does not claim TypeScript compilation or full tests unless separately reported.
