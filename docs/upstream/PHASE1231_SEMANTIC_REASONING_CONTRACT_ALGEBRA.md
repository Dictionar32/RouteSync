# Phase 1231 — Semantic reasoning / capability / dataflow contract algebra

## Canonical direction

```text
Laravel source evidence
  -> semantic relations / rewrite / fixed-point / judgment
  -> SemanticReasoningAlgebraInterface
  -> SemanticReasoningContractInterface
  -> SemanticCapabilityAlgebraInterface / SemanticDataflowAlgebraInterface
  -> SemanticCapabilityContractInterface / SemanticDataflowContractInterface
  -> concrete closed interfaces
  -> upstream authority
  -> UpstreamWiringInterface
  -> manifest / graph / IR / CLI
```

## Algebra rule

An `Interface` is not automatically a contract. The algebra defines the facets
and invariants first; the named contract composes that algebra; the concrete
closed interface is the consumable specialization.

### Reasoning

`SemanticReasoningAlgebraInterface` is operational. `SemanticReasoningContractInterface`
is proof-bearing and closed.

### Capability

`SemanticCapabilityAlgebraInterface` now includes `SemanticCapabilityClosureInterface`.
Therefore closure is an algebra invariant, not a property added only by the
named contract layer.

### Dataflow

`SemanticDataflowAlgebraInterface` now owns identity of the semantic dataflow
judgment, origin, closure, and reasoning authority. `SemanticDataflowContractInterface`
composes that algebra, and `SemanticDataflowInterface` is the concrete closed
specialization.

## Wiring rule

`UpstreamWiringInterface` remains downstream-owned. It is the explicit lane
between a closed upstream semantic contract and a downstream projection. It
must not become another semantic solver or classification authority.

## Non-reconstruction rule

Manifest, graph, IR and CLI may project, group, index, lower, and emit closed
contracts. They must not derive CRUD, intent, capability, policy, binding, or
dataflow closure again from route method/path/controller/model/schema.
