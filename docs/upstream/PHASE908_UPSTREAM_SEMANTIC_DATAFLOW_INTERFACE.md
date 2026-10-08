# Phase 908 — Upstream Semantic Dataflow Interface

Phase 908 distinguishes the closed `AstDataflowInterface` from the derived semantic knowledge dataflow analysis. They use different identity algebras and must not be collapsed by converting either side to text terms.

`SemanticDataFlowJudgment` now has a closed `SemanticDataFlowInterface` wrapper. The interface preserves complete semantic paths, guards, reachability, fixed-point status, and relation-closure reasoning. The existing text-based `analysis_reaches` stage projection remains a compatibility projection, not the authority.

The authority chain is:

```text
SemanticKnowledgeDataFlow
  -> SemanticDataFlowJudgment
  -> SemanticDataFlowInterface
  -> optional stage projection
```

The upstream AST dataflow authority remains:

```text
AstDataflowJudgment
  -> AstDataflowInterface
  -> AstAnalysisInterface
```

These are intentionally distinct levels until an explicit typed identity mapping is proven.
