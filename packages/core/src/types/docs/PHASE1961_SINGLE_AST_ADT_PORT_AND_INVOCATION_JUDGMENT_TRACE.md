# Phase 1961 — Single AST ADT Port and Invocation Judgment Trace

## AST interface-first correction

Phase 1960 had replaced the historical single `classify(request)` port with two interface methods (`expression` and `block`). That changed the public capability surface rather than preserving the established request/response ADT model. Phase 1961 restores one syntax port:

`AstClassifierEvidenceRequest<TokenDescriptor> → AstClassifierEvidenceInterface.classify → AstClassifierEvidenceResult<PhpAstValue, PhpBlock>`.

The request and response are closed discriminated unions with only `expression` and `block` variants. The facade dispatches the request and typed convenience exports project the expected result. A mismatched response is treated as a contract violation, not reclassified as semantic meaning. The parser remains in `astClassifierRuntime.ts`.

Semantic evidence is deliberately not another classifier request variant. The existing path remains:

`AstSemanticEvidenceRequest → produceAstSemanticEvidence → AstSemanticStageInterface`.

`AstSemanticEvidenceProducerInterface`, `AstSemanticInterface`, and `AstSemanticStageInterface` remain the authorities; Phase 1961 adds no parallel semantic authority.

## Laravel invocation judgment / integrated response trace

The existing closed model is retained rather than duplicated:

`CLI controller-source input → PhpSourceInvocationSemanticPipelineIntegrationResult → LaravelControllerInvocationSemanticJudgmentAuthority → LaravelControllerInvocationSemanticJudgmentInterface (outcome-indexed judgment) → LaravelControllerInvocationSemanticJudgmentInventoryAuthority.close → closure receipt / rejection ADT → LaravelControllerScannerInterface → manifest builder`.

The judgment type preserves the exact integrated response outcome (`not_connected`, `source_binding_rejected`, `complete`, or `blocked`) instead of flattening it to a success boolean or message. The scanner receives the inventory closure receipt and does not decide whether an invocation outcome is successful. Inventory closure separately validates project binding, completeness, source identity uniqueness, and one-to-one source/judgment correspondence.

## Interface-first judgment

- Keep one AST classifier port and closed request/response ADTs.
- Keep syntax classification separate from semantic judgment production.
- Keep the existing invocation judgment and integrated response union as the canonical upstream model.
- Keep the existing inventory authority as the closure boundary; do not create another authority or runtime reclassifier.
- The result ADT is not statically correlated to the input variant by this single non-overloaded TypeScript signature. Convenience projections therefore validate the returned discriminant and surface a contract violation if the implementation breaks its port. Eliminating that check while preserving exact call-site correlation would require a genuinely correlated type-level API; it must not be faked with `as` or hidden runtime reasoning.

## Verification boundary

The phase audit is static source-contract verification. Syntax transpilation is separate from a full package typecheck/build; no full build is claimed here.
