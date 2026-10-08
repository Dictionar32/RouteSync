# Phase 1254 — DataFlow Contract Algebra

This phase strengthens the generic data-flow surface without moving semantic authority downstream.

## Shape

`DataFlowExecutionAlgebraInterface` and `DataFlowAuthorityAlgebraInterface` remain separate facets.

They are composed by `DataFlowContractInterface`.

`DataFlowInterface` is now the public specialization of that contract rather than a direct merge of execution and authority facets.

## Boundary law

```text
semantic reasoning algebra
        -> semantic reasoning contract
        -> capability/dataflow semantic contracts
        -> upstream wiring
        -> downstream projection
```

The generic `DataFlowInterface` is an execution/authority contract. It is not a second semantic reasoning authority.

Consumers that only project data-flow use `DataFlowAuthorityInterface` through `UpstreamWiringInterface` and do not receive the execution surface.
