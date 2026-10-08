# Phase 1028 — Fact-Lineage Policy Endpoint Closure

## Finding

The Phase 1027 analysis policy selected source/sink facts by producer lineage, but
its `isSource`/`isSink` contributor matched an identity against **either endpoint**
of a selected fact.

That was too broad. A fact such as `model -> resource` selected for producer
`resource` could classify both the model and resource identities as sinks.

## Correction

The analysis policy now matches the queried identity only against
`fact.lineage.identity`.

This preserves the intended ownership split:

```text
semantic seed fact
  -> fact-scoped lineage
  -> analysis producer selection
  -> exact producer identity
  -> source/sink predicate
  -> canonical reaches(...)
```

The semantic dataflow authority and `DataFlowInterface` are unchanged.

## Producer semantics

Producer lineage remains evidence, not an intrinsic source/sink classification:

- `route`: route-binding producer identity
- `controller`: controller/query producer identity
- `resource`: resource producer identity
- `model_relation`: structural relation evidence when explicitly selected
- `schema`: structural schema evidence when explicitly selected

No producer is automatically declared to be a source or sink.

## External alignment

CodeQL separates the generic data-flow graph from analysis configuration and
uses source/sink predicates to scope a query; additional flow steps and barriers
are likewise configuration concerns. This supports keeping these predicates in
RouteSync's analysis layer rather than extending the upstream execution contract.

MLIR likewise centralizes fixed-point execution in `DataFlowSolver` while child
analyses contribute analysis state and transfer behavior. RouteSync therefore
continues to keep closure in the semantic authority and query policy downstream.
