# Phase 910 — Upstream Semantic Dataflow Contract

Phase 909 made `AstDataflowInterface` provenance explicit. The remaining boundary problem was that `SemanticDataFlowInterface` itself still lived entirely in the scanner implementation and therefore could not be treated as an upstream contract without importing scanner-specific `KnowledgeId`, facts, and guards.

Phase 910 moves only the **contract shape** to `types/upstream/semanticDataflowInterface.ts` and parameterizes identity, fact, and guard types.

## Authority shape

```text
scanner semantic knowledge algebra
  -> SemanticDataFlowInterfaceContract<KnowledgeId, SemanticDataFlowFact, SemanticFlowGuard>
  -> SemanticDataFlowInterface
```

The upstream layer owns:

- path shape;
- analysis shape;
- closed judgment invariants;
- least-fixed-point declaration;
- relation-closure derivation;
- interface authority marker.

The scanner continues to own:

- `KnowledgeId`;
- `SemanticDataFlowFact`;
- `SemanticFlowGuard`;
- semantic path calculation;
- relation expansion and closure implementation.

This mirrors the useful separation seen in MLIR interfaces and CodeQL dataflow: the generic analysis/interface boundary is separate from the concrete node/value vocabulary and source/sink configuration. MLIR explicitly uses interfaces to decouple generic analyses from concrete operation/dialect implementations; CodeQL similarly separates its dataflow graph semantics from configuration and source/sink modeling.

The compatibility `analysis_reaches` projection remains downstream and is not promoted to authority.
