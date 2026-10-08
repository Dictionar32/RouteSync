# Phase 1212 — Upstream semantic authority and dataflow judgment algebra

## Direction

`Laravel/source evidence -> upstream semantic authority -> closed contract -> interface composition -> manifest/graph/IR/CLI`.

## Strengthening

- Route domain resolution is now owned by `routeDomainAuthority` in the upstream semantic surface.
- `RouteDomainResolver` remains only as a deprecated compatibility adapter.
- Downstream route graph/boundary/descriptor consumers use the upstream authority directly.
- `SemanticDataflowJudgmentInterface` separates identity, evidence, fixed-point reasoning, authority, and closure facets.
- `SemanticCapabilityContract` remains a composition of identity/evidence/derivation/provenance/closure.
- `DataFlowExecutionInterface` remains producer/runtime; `DataFlowAuthorityInterface` remains the read-only downstream surface.

## Algebra

```text
A --InterfaceDependencyBoundary--> B --InterfaceDependencyBoundary--> C

Semantic capability:
Identity + Evidence + Derivation + Provenance + Closure

Semantic dataflow judgment:
Identity + Evidence + Fixpoint + Authority + Closure

DataFlow runtime:
Seed + Derive + Close

DataFlow authority:
Input + State + Reaches + Closure + upstream authority
```

## Remaining frontier

`ResourceModelResolver` still consumes compiler-owned `ModelSymbolTable` and controller/resource subscanner structures. It should therefore not be blindly moved into `types/upstream`. The correct next step is to define an upstream-neutral resource/model evidence contract, then move the semantic authority over that contract upstream.


## Phase 1213 refinement: downstream projection naming

The CLI `route-classifier` surface is retained only as a compatibility facade.
Canonical consumers now import `route-capability-projection`, whose job is to
project an already-closed upstream `RouteCapabilityContract` into generator and
grouping views. It must not infer CRUD semantics from method/path.

The intended composition is:

```text
SourceEvidence
  -> SemanticAuthority
  -> ClosedCapability
  -> InterfaceDependencyBoundary
  -> DownstreamProjection
  -> Manifest / Graph / IR / CLI
```

The composition law is directional: if `P(A,B)` and `P(B,C)` exist, downstream
may compose them as `P(B,C) ∘ P(A,B)`. Upstream never imports or depends on C.
Identity/associativity are architectural laws checked by audit rather than
runtime behavior.

Data-flow keeps the same split: execution (`seed/derive/close`) produces a
closed judgment; authority (`input/state/reaches/closed`) is the read-only
consumer surface.
