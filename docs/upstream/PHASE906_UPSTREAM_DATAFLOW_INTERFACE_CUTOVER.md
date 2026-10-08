# Phase 906 — Upstream Dataflow Interface Cutover

## Trace finding

`AstDataflowInterface` was already the canonical closed dataflow authority, but
`AstAnalysisInterface` still declared an unused duplicate `dataflow_relation`
vocabulary with primitive `source: number` / `target: number` identities.
That created a second dataflow ontology below the canonical upstream boundary.

## Cutover

Analysis now carries the exact `AstDataflowFact` through:

```text
SemanticKnowledgeDataFlow
  -> AstDataflowJudgment
  -> AstAnalysisFact(dataflow_fact)
  -> AstAnalysisJudgment
```

The existing `dataflow_closure` fact remains as the explicit closure witness;
`dataflow_fact` preserves each closed relation without re-encoding its identity.

## Interface rule

`AstDataflowInterface` owns dataflow semantics. `AstAnalysisInterface` consumes
that interface/judgment; it does not define another source/target vocabulary.

This follows the interface-oriented compiler pattern: analyses operate on a
stable semantic interface rather than special-casing each concrete producer.
MLIR documents the same motivation for interfaces, while its dataflow framework
models propagation over explicit analysis facts and program points.

## Laravel/e-commerce workload

The checked-in Phase 905 workspace does not contain the historical
`examples/ecommerce-shop-source` directory despite older Phase 760 documentation
referencing it. Existing e-commerce tests remain the available workload. No
fixture is fabricated to compensate for the missing directory.

## Invariants

- no duplicate primitive dataflow identity;
- no `any` / `unknown` semantic escape;
- dataflow identity remains source-span + typed role + typed slot;
- least-fixed-point closure remains the dataflow authority;
- analysis consumes canonical upstream dataflow facts.
