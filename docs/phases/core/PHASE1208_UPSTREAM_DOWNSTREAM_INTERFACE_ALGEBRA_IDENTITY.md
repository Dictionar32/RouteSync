# Phase 1208 — Upstream → Downstream Interface Algebra + Capability Identity

## Trace

The previous interface algebra already separated:

`SemanticCapabilityContract -> downstream projection -> manifest/graph/IR/CLI`

The remaining weakness was that `SemanticCapabilityIdentityInterface` existed as a facet but was not composed into `SemanticCapabilityContract`. A capability could therefore carry evidence/derivation/provenance/closure without making identity part of the canonical contract.

## Repair

`SemanticCapabilityAlgebraInterface<Identity, Evidence>` now composes:

- identity
- evidence
- derivation
- provenance

`SemanticCapabilityContract` extends that algebra plus closure and upstream authority.

`RouteCapabilityContract` specializes the identity to canonical `RouteIdentity`. The route capability builder materializes the identity once at the upstream boundary.

## Direction

```text
Laravel source evidence
        ↓
Upstream semantic capability algebra
  identity + evidence + derivation + provenance + closure
        ↓
SemanticCapabilityContract
        ↓
DataFlowCapabilityAuthorityInterface
        ↓
InterfaceDependencyBoundary (downstream-owned)
        ↓
manifest / graph / IR / CLI
```

Downstream consumers must not reconstruct identity, capability, CRUD meaning, or provenance.

## External architectural references

- MLIR interfaces: generic transformations/analyses operate through interfaces without encoding operation-specific knowledge.
- MLIR DataFlowSolver: analysis execution and fixed-point orchestration are separated from querying resulting analysis state.
- CodeQL data flow: semantic data-flow nodes/edges are distinct from AST structure; shared data-flow infrastructure consumes language-specific graph definitions.
- TypeScript compiler architecture: parser, binder, checker, and emitter have distinct responsibilities; semantic checking is not pushed into emission.
- Laravel routing/resource controllers: route/controller/resource declarations provide source evidence for capability derivation.
