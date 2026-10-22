# Phase 1398 — AST classifier single-interface boundary

`astClassifierEvidence` no longer exposes the semantic evidence builder as a positional triple (`node`, `source`, `tokens`). It receives one `AstClassifierEvidenceInput<TToken>` contract and exposes a narrow `AstClassifierEvidenceInterface<TToken>` with one `classify` operation.

The contract is generic over token representation so the upstream type layer does not import the scanner/compiler runtime. The request contains only the evidence required to produce scanner-stage facts. It does not accept a compiler program, full manifest, graph, or target projection.

The implementation still owns PHP syntax classification; it does not own semantic reasoning authority. It returns the existing closed `AstSemanticStageInterface` through the established stage authority/algebra. This phase narrows the boundary without rewriting parser internals or changing package/build configuration.

Audit: `scripts/audits/audit-phase1398-ast-classifier-single-interface.cjs`.
