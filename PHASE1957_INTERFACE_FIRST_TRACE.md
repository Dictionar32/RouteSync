# Phase 1957 — AST Semantic Integrated Response, Interface First

## Trace

`PHP source/tokens -> astClassifierEvidenceInterface.classify(request ADT) -> astClassifierRuntime syntax classification -> astSemanticEvidenceProducer -> astSemanticStageInterfaceOf -> semantic response ADT -> AST/scanner consumer`.

The prior implementation exposed a single syntax port but semantic evidence was produced through a separate positional helper path. That contradicted the documented `semantic` request variant and made the integrated contract incomplete.

## Interface-first change

- `AstClassifierEvidenceRequest` now includes the `semantic` variant with `AstNodeIdentity`, `SourceSpan`, and tokens.
- `AstClassifierEvidenceResult` now includes the corresponding `semantic` result carrying `AstSemanticStageInterface`.
- The canonical `classify` dispatcher owns the semantic request path and returns the closed stage interface.
- `classifyAstSemanticEvidence` is now only a typed projection over the canonical port; it no longer calls the producer directly.
- Public core barrel exports the request/result/interface types and the semantic stage interface.

## Authority boundary

The AST classifier interface is a unified request/response contract, not a second semantic solver. `astSemanticEvidenceProducerInterface` and the existing AST semantic stage authority remain the upstream producers of the stage judgment. The scanner runtime still performs PHP syntax parsing; this phase does not claim to convert TypeScript interface declarations into executable logic.

## Non-goals

No parser rewrite, no duplicate semantic authority, no replacement of syntax rules with relation wrappers, no full build.
