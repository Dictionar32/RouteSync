# Phase 1014 — DataFlow upstream trace and micro-interface composition

## Trace

The canonical dependency lane is:

```text
Laravel source evidence
  routes/api.php
  app/Http/Controllers/*
  app/Models/*
        |
        v
source scanner / source-model compiler
        |
        v
ManifestBuilderInterface
        |
        | seed
        v
SemanticDataflowInput
        |
        v
SemanticDataflowInterface
  = Seed + Derivation + Closure + Reachability
        |
        +-------------------+
        |                   |
        v                   v
IR Projection          Graph Projection
```

The ecommerce fixture provides real semantic flow evidence rather than an
abstract fixture. Routes bind values such as `{id}`, `{produkItemId}` and
`{orderId}`; controllers propagate request values through Eloquent queries;
models declare `belongsTo`, `hasMany`, and `hasOne` relationships. Examples
include `ProdukController::index` using `whereHas('category', ...)` and
`ProductReviewController::store` using `whereHas('order', ...)` with the
authenticated user id.

Laravel's Eloquent API defines `whereHas` as a relationship-existence query
with where constraints. These calls therefore belong to semantic query/value
flow evidence, while the model relationship declarations remain structural
relation evidence.

## Interface boundary

`DataFlowInterface` is intentionally limited to data-flow operations:

- `DataFlowSeedInterface`
- `DataFlowDerivationInterface`
- `DataFlowClosureInterface`
- `DataFlowReachabilityInterface`

`DataFlowProjectionInterface` is separate. Manifest construction uses only the
seed capability. IR and Graph use only projection. This prevents a projection
from becoming an accidental solver and follows the same separation principle
used by shared data-flow frameworks: configuration/analysis contracts are
small, while a single engine/authority performs the fixed-point computation.

## CFG lane

Compiler-local CFG propagation uses:

- `DataFlowForwardInterface`
- `DataFlowBackwardInterface`
- `ControlFlowDataFlowInterface = forward & backward`

`DataFlowAnalysis<T>` implements the aggregate. The raw forward/backward solver
functions remain implementation details.

## Authority rule

Only `semanticDataflowAuthority.ts` constructs the semantic fixed point.
Manifest, Graph, and IR must not call the semantic solver. Graph remains a
structural graph projection and materializes `GraphEdgeRelation` through its
canonical sink.
