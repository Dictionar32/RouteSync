# Phase 1958 — AST Source Domain and Correlated ADT, Interface First

> Historical trace: the `PhpSourceText` classifier request described below was superseded by Phase 1959 after further inspection showed that `PhpSourceText` only wraps `StringValue` and does not bind source identity, span, or lexical evidence. See `PHASE1959_INTERFACE_FIRST_TRACE.md`.

## Trace

The prior phase exposed `AstClassifierEvidenceRequest` with `value.raw: string`. That contract made the AST classifier port accept an unqualified primitive even though the upstream source frontend already defines `PhpSourceText` as a domain type containing a `StringValue`.

Traced path:

`LaravelSourceLexer.classifyAstValue(source fragment) → classifyAstValue convenience projection → astClassifierEvidenceInterface.classify({ kind: 'value', source: PhpSourceText }) → astClassifierRuntime.classifyAstValue(source text) → PhpAstValue ADT`.

Semantic path remains integrated through the same port:

`AstClassifierSemanticRequest(node identity + source provenance + token evidence) → classify → produceAstSemanticEvidence → astSemanticStageInterfaceOf → AstClassifierSemanticResult → scanner/AST consumer`.

Laravel controller invocation remains upstream-owned:

`LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt → sourceAstScanner / Laravel source AST pipeline → controller scanner → parseControllerDeclarationFromInvocationJudgment → AST/manifest projection`.

The AST classifier change does not introduce a second invocation authority and does not reclassify the closed invocation inventory.

## Interface-first changes

- Replaced `raw: string` in the value request with `source: PhpSourceText` from the existing upstream PHP source frontend domain.
- Added `phpSourceTextOf()` as the explicit source-ingress constructor for legacy string-facing scanner APIs.
- Kept the parser runtime accepting character data at the syntax boundary; the semantic request contract no longer leaks that primitive representation.
- Changed the single `classify` operation to overload by request variant, pairing `value → value`, `tokens → tokens`, `block → block`, and `semantic → semantic` statically.
- Removed redundant runtime result-kind checks from typed convenience projections; overloads guarantee the result shape for well-typed requests.
- Exported the request/result variants and source domain from the public core barrel.
- Updated Phase 1399's historical audit expectation to reflect the current overload-based contract.

## Authority boundary

`AstClassifierEvidenceInterface` is the scanner-facing port. `astClassifierRuntime` remains syntax implementation; `astSemanticEvidenceProducer` and the existing AST semantic stage authority remain semantic judgment owners. The interface declares the allowed operation and result shape; it does not execute reasoning by itself.

## Follow-up frontier

The `LaravelSourceLexer` public facade and parser internals still expose string-taking syntax entry points because the parser consumes source characters. Future work should distinguish legitimate lexical ingress from semantic contract fields and avoid mechanically replacing every string in parser implementation. This phase specifically removes the primitive from the upstream request ADT and makes request/result variants correlated.
