# Phase 1016 — DataFlow configuration micro-capabilities

The semantic data-flow boundary now separates execution operations from
flow-model configuration, following the useful CodeQL `ConfigSig` pattern.

## Configuration capabilities

- `DataFlowSourcePredicateInterface` — identifies semantic source nodes.
- `DataFlowSinkPredicateInterface` — identifies semantic sink nodes.
- `DataFlowAdditionalStepInterface` — identifies value-preserving/custom flow edges.
- `DataFlowBarrierInterface` — identifies nodes that block flow.
- `DataFlowConfigInterface` — type-level composition of those capabilities.

`SemanticDataflowInterface` composes `DataFlowInterface` with
`DataFlowConfigInterface`. The authority derives source/sink/additional-step
views from the existing canonical facts. `isBarrier` currently returns false
because the closed RouteSync fact algebra has no barrier fact; introducing a
fake barrier ADT would create unsupported semantics.

## Important ownership rule

The configuration view does not run a solver. `semanticDataflowAuthority.ts`
remains the sole owner of least-fixed-point closure and path derivation.
Manifest remains seed construction; IR and Graph remain projections.

## Laravel mapping

- route parameters / request-controlled identities can become source candidates;
- controller/query targets can become sink candidates;
- model/resource/controller semantic edges can contribute additional flow steps;
- no barrier is invented until the upstream semantic model has evidence for one.

This is deliberately a typed configuration view over existing facts, not a
second dataflow implementation.
