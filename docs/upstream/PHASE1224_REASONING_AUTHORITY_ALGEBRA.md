# Phase 1224 — Reasoning Authority as Algebra Facet

The reasoning contract is now an explicit facet of the semantic capability algebra and the canonical DataFlow authority algebra.

```text
Laravel evidence
  -> semantic relations
  -> rewrite
  -> fixed point
  -> judgment
  -> reasoning proof contract
  -> capability/dataflow authority algebra
  -> InterfaceDependencyBoundary
  -> manifest / graph / IR / CLI
```

This is stronger than attaching `reasoning` only to a concrete contract: the algebra itself declares that downstream-visible semantic authority carries a closed reasoning proof.

Execution remains separate. Downstream projections do not receive `seed`, `derive`, `close`, `relate`, `rewrite`, or `fixedPoint`.

External alignment: CodeQL separates AST nodes from data-flow nodes and exposes configurable flow/closure semantics; MLIR uses interfaces so generic transformations can consume semantic capabilities without dialect-specific knowledge. Laravel route/controller/model-binding constructs remain upstream evidence. TypeScript 7's faithful structural port reinforces keeping semantic contracts stable while implementations evolve.


## Phase 1225 — explicit upstream → wiring → downstream algebra

The generic `InterfaceDependencyBoundary<Upstream, Downstream>` remains the minimal dependency primitive. `UpstreamWiringInterface<Upstream, Downstream>` now refines it with two architectural invariants: `direction: 'upstream_to_downstream'` and `upstreamAuthority: 'upstream'`.

The wiring algebra is downstream-owned. Upstream semantic contracts do not import it. DataFlow projections and semantic capability projections consume the refined wiring boundary, while the authority remains read-only and proof-carrying.

Canonical topology:

`Laravel evidence → semantic reasoning algebra → proof contract → upstream authority → UpstreamWiringInterface → Manifest/Graph/IR/CLI projection`.

This is deliberately a boundary refinement, not another semantic resolver. The next work should therefore migrate remaining semantic ownership (`ResourceModelResolver`, request dataflow inference, controller policy) rather than adding more interface wrappers.
