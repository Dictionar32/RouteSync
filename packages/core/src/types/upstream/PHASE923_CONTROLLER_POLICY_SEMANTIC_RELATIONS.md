# Phase 923 — Controller Policy Semantic Relations

Phase 923 closes the boundary between the Phase 922 Laravel `EffectiveControllerActionPolicy`
and the canonical upstream semantic relation graph.

## Authority

```text
EffectiveControllerActionPolicy
  -> ControllerActionPolicyRelation
  -> SemanticRelationGraph
  -> generic graph/dataflow projection
```

`ControllerActionPolicyRelation` is domain semantic policy. It is deliberately not a
`SemanticDataflowFact` and does not add Laravel-specific variants to the dataflow algebra.

## Relations

- `controller_action_middleware_policy` represents middleware effective for one concrete action.
- `controller_action_authorization_policy` represents action-applicable authorization policy.

The existing `sourceModelReferenceIndexFromCatalog()` accepts closed effective policies as an
optional semantic input and adds their projected relations to the same canonical relation graph.
No second policy-to-graph materialization path is introduced.

## Dataflow boundary

Only the generic semantic relation graph is downstream input. CodeQL-style dataflow remains a
value-flow graph rather than an AST/policy vocabulary, and the existing `SemanticDataflowFact`
algebra is unchanged.

## E-commerce corpus

`examples/ecomerce-shop-source` and `examples/ecommerce-shop-source` remain absent. Historical
inline source identifiers are provenance labels, not filesystem fixtures. Existing inline
Laravel e-commerce regression tests remain the regression corpus.
