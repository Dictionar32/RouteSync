# Phase 1256 — Strategy-Indexed Semantic Reasoning Contract

## Boundary

Semantic reasoning now follows an explicit type-level chain:

```text
SemanticReasoningAlgebraInterface
        ↓
SemanticReasoningContractInterface<Strategy, EvidenceForStrategy<Strategy>>
        ↓
SemanticReasoningContract<Strategy, EvidenceForStrategy<Strategy>>
        ↓
SemanticCapability / SemanticDataflow authority
        ↓
UpstreamWiringInterface
        ↓
downstream projection
```

## Contract law

The reasoning evidence is no longer merely parameterized as an arbitrary
`SemanticReasoningEvidence`. It is indexed by the reasoning strategy:

- `evidence_resolution`
  → `semantic_evidence_resolution`
- `declarative_relation_rewrite_fixed_point`
  → `semantic_relation_fixed_point`

Therefore a closed reasoning contract cannot claim a strategy while carrying
an incompatible evidence kind at the interface boundary.

## Authority law

`SemanticReasoningAuthorityInterface` is reusable by capability and data-flow
boundaries, but it remains read-only. It transports an already-closed reasoning
contract and does not expose inference, classification, resolution, or lookup.

## Wiring law

The downstream path remains:

```text
upstream semantic algebra
    → closed contract
    → upstream authority
    → upstream-to-wiring algebra
    → directional wiring contract
    → downstream projection
```

The wiring layer remains structural. Semantic ownership does not move into
`InterfaceDependencyBoundary`, graph, IR, manifest, or CLI projections.

## External alignment

MLIR interfaces are designed so generic transformations/analyses interact with
IR through interfaces rather than encoding concrete operation semantics.
CodeQL separates AST representation from a data-flow graph and supplies generic
flow solving/closure. Laravel route model binding demonstrates that route,
parameter, model, key, and relationship semantics are related source evidence.
These patterns support keeping RouteSync semantic authority upstream while
making downstream consumers contract-driven.
