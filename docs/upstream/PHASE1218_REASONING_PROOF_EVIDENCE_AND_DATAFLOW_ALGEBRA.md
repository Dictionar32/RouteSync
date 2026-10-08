# Phase 1218 — Semantic Reasoning Proof-Evidence and DataFlow Algebra

## Purpose

The semantic reasoning contract is a typed proof boundary, not merely metadata. Its evidence facet is parameterized by a closed evidence object so capability and data-flow authorities can carry a concrete reasoning witness without exposing the reasoning engine to downstream consumers.

## Algebra

```text
Source Evidence
      |
      v
SemanticReasoningExecutionInterface
      |
      v
SemanticReasoningContractInterface<Evidence>
      |
      +-- evidence
      +-- derivation
      +-- provenance
      +-- closure
      |
      v
SemanticReasoningContract
      |
      +------------------+
      v                  v
SemanticCapability   DataFlowAuthority
      |                  |
      +--------+---------+
               v
   InterfaceDependencyBoundary
               |
       Manifest / Graph / IR / CLI
```

## Direction law

For interfaces `A`, `B`, and `C`, a composition is valid only when:

```text
P(A,B) : A -> B
P(B,C) : B -> C
-----------------
P(A,C) : A -> C
```

The upstream contract must never import or depend on the downstream projection. Downstream may consume a closed contract but must not reconstruct semantic meaning.

## DataFlow specialization

`DataFlowExecutionAlgebraInterface` specializes the reasoning execution algebra (`seed`, `derive`, `close`). `DataFlowAuthorityInterface` is a read-only semantic boundary containing input, state, reachability, reasoning proof, and closure. Consumers should depend on the authority surface rather than the full execution interface.

## Remaining frontier

`ResourceModelResolver` remains compiler-owned because its inputs still contain compiler-specific symbol-table/resource structures. The correct migration is to define an upstream-neutral resource/model evidence contract first, then move authority ownership upstream.

`routeCapabilityAuthority` is upstream-owned but still contains host-language branching and collection operations in its semantic derivation. The next algebraic refinement should express route-shape evidence as declarative relations and derive CRUD role through relation rewrite/fixed-point closure rather than adding another classifier.
