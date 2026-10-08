# Phase 1026 — Concrete Fact-Scoped Dataflow Analysis Policy

Phase 1025 established fact-level producer lineage and removed producer provenance from the coarse input origin. The remaining downstream gap was that `DataFlowFactPolicyInterface` and `DataFlowConfigContributorInterface` existed as reusable contracts without a production query-policy consumer.

Phase 1026 adds `semanticDataflowFactAnalysisPolicy.ts` in `compiler/analysis/dataflow`.

## Boundary

```text
SemanticDataflowFact.lineage
        |
        v
DataFlowFactPolicyInterface
        |
        v
selected seed facts
        |
        v
DataFlowConfigInterface
        |
        v
source/sink query predicates
        |
        v
SemanticDataflowInterface.reaches()
```

The policy is deliberately **not** a semantic solver. It never adds facts, computes closure, or changes the canonical judgment. `SemanticDataflowAuthority` remains the sole least-fixed-point authority.

## Important non-inference rule

A producer name is not itself a source/sink classification. The caller explicitly supplies the producer set for a query. `route`, `controller`, `resource`, `model_relation`, and `schema` therefore remain evidence domains rather than universally prescribed source/sink roles.

The default additional-step and barrier predicates are false because this policy does not invent semantic edges or sanitization rules.

## Ecommerce consequence

The ecommerce manifest can contain route, controller/query, and resource facts in one controller-scoped input. The policy selects those facts individually by lineage rather than reading an input-level producer. Model-relation and schema facts remain structural unless a future analysis explicitly selects them.

## External alignment

CodeQL places source/sink/barrier/additional-step selection in a query-specific data-flow configuration while a generic flow engine performs reachability. RouteSync follows the same ownership direction, but keeps semantic fixed-point closure in its upstream authority and treats this layer as a downstream query over that closed result.

MLIR similarly separates `DataFlowSolver` orchestration from child analysis policy and state. RouteSync does not move solver ownership into this policy layer.
