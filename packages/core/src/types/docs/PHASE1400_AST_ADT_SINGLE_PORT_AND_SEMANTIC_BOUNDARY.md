# Phase 1400 — AST ADT single-port and semantic boundary

The prior AST port still exposed separate `classifyValue`, `classifyTokens`, and `classifyBlock` methods. That was a wider capability surface than necessary and let callers treat parser-specific operations as separate authorities.

The upstream contract now uses one `AstClassifierEvidenceInterface.classify(request)` method. `AstClassifierEvidenceRequest` is a closed discriminated union (`value`, `tokens`, `block`, `semantic`) and `AstClassifierEvidenceResult` preserves the matching result variant. The runtime is a dispatcher/implementation; typed convenience exports are projections over this single port and do not create additional semantic authorities. The facade uses explicit discriminant checks rather than type assertions.

Trace boundary:

`Laravel source evidence -> scanner AST runtime -> single AST request/result ADT -> semantic evidence relation -> upstream semantic/dataflow authority -> closed judgment/contract -> wiring -> manifest/graph/IR -> CLI/SDK/React/Next.js target projection`.

AST syntax nodes and dataflow nodes remain distinct. The semantic dataflow authority owns judgment closure; IR and target consumers project the closed judgment rather than repeat semantic reasoning. The phase audit records static source-boundary checks, not a successful TypeScript build.


## Phase 1958 contract refinement

The `value` request now carries `PhpSourceText` instead of `raw: string`. The single `classify` operation uses overloads so each request discriminant has a corresponding result discriminant at the type boundary. The scanner convenience functions unwrap the selected result directly; runtime mismatch branches are unnecessary for well-typed requests.
