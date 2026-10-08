# Phase 1255 — Semantic Reasoning Contract + Upstream Wiring Algebra

This phase strengthens two boundaries without moving semantic authority downstream.

## 1. Semantic reasoning

The reasoning surface remains:

```text
SemanticReasoningAlgebraInterface
        ↓
SemanticReasoningContractInterface
        ↓
SemanticReasoningContract
        ↓
capability / dataflow authority
```

`SemanticReasoningEvidenceForStrategy<Strategy>` makes the evidence kind selected by
`semanticReasoningContract(strategy)` explicit at the type boundary. The factory no
longer returns an unparameterized evidence contract.

This preserves the existing separation between the operational reasoning algebra
and the closed proof-carrying contract. `SemanticReasoningInterface` is not made to
extend the closed contract because execution and closed proof are different roles.

## 2. Upstream → wiring → downstream

The dependency boundary is now explicitly layered:

```text
InterfaceDependencyAlgebraInterface<Upstream, Downstream>
        ↓
InterfaceDependencyContractInterface<Upstream, Downstream>
        ↓
InterfaceDependencyBoundary<Upstream, Downstream>
        ↓
UpstreamWiringInterface<Upstream, Downstream>
        ↓
downstream projection/materialization
```

The wiring layer remains structural. It intentionally has no `infer`, `resolve`,
`classify`, `lookup`, or semantic `derive` operation. Semantic meaning must already
be closed upstream before this boundary is crossed.

## 3. Combined law

```text
Laravel/source evidence
  → upstream semantic relations / reasoning
  → closed capability / dataflow contract
  → UpstreamWiringInterface
  → manifest / graph / IR / CLI projection
```

This matches the architectural principle that generic interfaces should let
consumers operate without re-encoding concrete semantic knowledge. MLIR uses
interfaces for generic analyses/transformations, while CodeQL separates its data-flow
graph from the AST and provides a generic solver over that graph. RouteSync applies
the same separation to source semantics and downstream materialization.
