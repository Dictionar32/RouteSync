# Phase 1040 — DataFlowInterface as the Universal Downstream Boundary

## Decision

Every production downstream consumer of semantic dataflow consumes the generic
`DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>`.
Consumers do not type against `SemanticDataflowInterface` and do not reclassify
route/controller/request/model/resource/schema facts into a second dataflow model.

## Canonical path

`route/controller/request/model_relation/resource/schema evidence`
`-> SemanticDataflowInput`
`-> canonical DataFlowInterface state`
`-> AST / policy / IR / query consumers`

The semantic wrapper remains an upstream construction specialization. Its current
closed judgment is installed as `DataFlowInterface.state`; downstream reads state
and uses `reaches(state, source, target)` through the generic contract.

## Why state is part of the generic contract

A downstream projection must consume the already-closed state without invoking
`close()` again. Exposing `state` on the generic interface makes the current
closed state available without requiring a consumer-specific cast or wrapper
classification. The generic contract still contains no Laravel, route, controller,
schema, resource, model-relation, source/sink, barrier, or additional-step policy.

## Boundary rules

- Manifest, route, request, controller, model relation, resource, and schema are producers/evidence surfaces.
- SemanticDataflowAuthority is the single closure authority.
- AST analysis consumes only `DataFlowInterface` and its canonical state.
- Dataflow policies consume only `DataFlowInterface` and its canonical state/query.
- IR consumes only `DataFlowInterface` and projects its state.
- Graph remains structural and never becomes a dataflow solver.
- No downstream layer reconstructs closure or reclassifies semantic identities.

## Audit

`scripts/audits/audit-phase1040-dataflow-interface-consumer-boundary.cjs`

The Phase 1040 audit is authoritative for this boundary; older audits that
assert direct `SemanticDataflowInterface.judgment` consumption are historical
contract checks and must not be interpreted as regressions against Phase 1040.
