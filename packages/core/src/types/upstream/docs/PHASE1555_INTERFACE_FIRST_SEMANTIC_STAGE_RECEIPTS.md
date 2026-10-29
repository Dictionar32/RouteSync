# Phase 1555 — Interface-first semantic derivation contract

## Architectural finding

The previous `SemanticTypeDerivationProof` declared a fixed list of stages and a single total result count. That proved the *name/order* of the pipeline and total count, but did not express which stage admitted how much source evidence or how many results each stage contributed. The runtime contract therefore could not reject a judgment whose total was inconsistent with its stage-level derivation claims.

## Interface model change

`SemanticTypeDerivationProof` now exposes an ordered, typed tuple of stage receipts:

- `resource`: evidence count from `request.resources`, contribution count from resource derivation;
- `route_response`: evidence count from `request.routes`, contribution count from route-response derivation;
- `model`: evidence count from `request.models`, contribution count from model derivation.

The contract requires the receipts to preserve canonical stage order, each evidence count to match the request, each contribution to be a non-negative integer, and the sum of contributions to equal the judgment result length. The authority produces these receipts from the actual stage outputs; the executor only checks the contract and does not perform derivation.

This is an interface/model change, not a runtime-function relocation.

## Trace: current responsibility boundaries

- `types/upstream/semanticTypeDerivationInterface.ts`: canonical request, authority port, executor port, judgment, proof, and executable contract validation.
- `compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts`: invokes the existing resource, route-response, and model derivation algebra and emits receipts from those stage results.
- `compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts`: delegates to the authority and validates the returned judgment.
- `compiler/scanner/subscanners/SemanticTypeDeriver.ts`: compatibility facade over the executor; no direct derivation rule is implemented there.
- `compiler/scanner/subscanners/RequestTypeDeriver.ts` and `subscanners/request-deriver/groupAggregator.ts`: still perform request-type derivation under scanner. This is a genuine remaining semantic-ownership frontier; it is not fixed by moving those files.
- `compiler/frontend/php/astClassifierRuntime.ts`: constructs a semantic decision contract and rule precedence locally while also parsing/building PHP AST nodes. It already consumes upstream algebras, but the ownership of its candidate precedence/rule set is still mixed with scanner implementation. The next interface-first improvement should make the upstream contract own the rule-set/precedence model and have this runtime provide only source-specific evidence and rule implementations.
- `compiler/scanner/wiring/routeManifestTypeLowering.ts`: calls both request-type and semantic-type derivation facades. It is wiring, but the RequestType path still points into scanner-owned derivation, so the interface boundary is incomplete.

## Limits

Stage receipts are accounting evidence, not a mathematical proof that each source AST was semantically interpreted correctly. They strengthen the contract's falsifiability and provenance but do not close the remaining RequestType or AST-classifier ownership gaps.
