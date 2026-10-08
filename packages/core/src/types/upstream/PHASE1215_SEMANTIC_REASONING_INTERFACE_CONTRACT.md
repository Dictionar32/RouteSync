# Phase 1215 — Semantic Reasoning Interface / Contract

RouteSync now treats semantic reasoning as an explicit upstream algebra and contract.

## Shape

```text
Source Evidence
    ↓
SemanticReasoningInterface
    ├─ seed
    ├─ derive
    ├─ close
    └─ judge
    ↓
SemanticReasoningContract
    ├─ authority = upstream
    ├─ strategy
    └─ closed = true
    ↓
SemanticCapabilityContract / SemanticDataflowJudgment
    ↓
InterfaceDependencyBoundary
    ↓
Manifest / Graph / IR / CLI
```

`SemanticReasoningInterface` is operational algebra, not an opaque `reason(input): output` black box. `SemanticReasoningContract` is the proof-bearing ownership/closure witness carried by an upstream semantic result.

## Capability

`SemanticCapabilityContract` now carries `reasoning: SemanticReasoningContract`. Therefore a closed capability identifies not only its evidence, derivation, provenance, and identity, but also the upstream reasoning strategy that produced it.

## Dataflow

`DataFlowExecutionAlgebraInterface<Input, State>` composes `SemanticReasoningExecutionInterface<Input, State>`. The existing `seed/derive/close` surface therefore has an explicit semantic relationship to reasoning. `DataFlowAuthorityInterface` remains read-only and carries the reasoning contract; downstream still cannot invoke semantic re-solving.

The semantic dataflow adapter records `declarative_relation_rewrite_fixed_point`, matching the existing least-fixed-point judgment.

## Upstream → downstream law

```text
A --P(A,B)--> B --P(B,C)--> C
```

`InterfaceDependencyBoundary<A,B>` is owned by the downstream projection. Composition is directional. Upstream semantic contracts never import or implement downstream projection boundaries merely to be consumable.

## External alignment

CodeQL models data flow as a semantic graph distinct from the AST and exposes source/sink, additional-flow-step, and closure/flow operations. MLIR uses generic interfaces to avoid dialect-specific knowledge in transformations and uses lattices/fixpoints for dataflow reasoning. These patterns support keeping RouteSync reasoning and dataflow contracts explicit, generic, and compositional.

## Proof-carrying reasoning refinement

The reasoning contract is now more than `authority + strategy + closed`. It
carries four explicit facets: evidence kind, derivation strategy, upstream
provenance, and closure. These facets form a reusable contract boundary while
remaining independent from any concrete resolver implementation.

The intended composition is:

`Evidence -> ReasoningInterface -> ReasoningContract -> Judgment -> Capability/DataFlowAuthority -> Projection`

The contract is a witness of semantic ownership and closure; domain evidence
remains on the concrete capability or judgment so the generic reasoning layer
does not invent domain facts.


### Phase 1217 contract refinement

`SemanticReasoningContractInterface<Evidence>` is now the explicit contract algebra. `SemanticReasoningContract` is only its closed concrete specialization. This preserves the direction `evidence -> reasoning interface -> contract -> capability/dataflow -> downstream projection` without coupling downstream consumers to a concrete reasoning implementation.
