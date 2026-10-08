# Phase 1227 — Semantic Reasoning Relation Table

The reasoning contract factory no longer decides evidence semantics with a conditional branch.

Canonical relation:

```text
SemanticReasoningStrategy
        │
        ▼
strategy → evidence-kind relation table
        │
        ▼
SemanticReasoningEvidence
        │
        ▼
SemanticReasoningProof
        │
        ▼
SemanticReasoningContract
```

This is deliberately upstream-owned. The table is a closed semantic relation, while the factory only materializes the contract.

The downstream path remains:

```text
Contract → Authority → UpstreamWiringInterface → Projection → Manifest / Graph / IR / CLI
```

No build is run in this checkpoint. Validation is static architecture audit only.
