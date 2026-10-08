# Phase 946 — Upstream End-to-End Consumption Proof

Phase 946 proves the current upstream ownership and downstream consumption
boundary instead of introducing another wiring layer.

## Canonical upstream

- `packages/core/src/types/upstream` is the canonical semantic contract.
- `packages/core/src/upstream` is absent.
- `packages/core/src/compiler/scanner/upstream` is a producer/adapter boundary.
- Production imports do not reverse from upstream contracts into scanner code.

## Laravel policy lane

```text
Laravel controller/resource evidence
  -> ControllerPolicyRelation
  -> EffectiveControllerActionPolicy
  -> ControllerActionPolicyRelation / RouteActionPolicyRelation
  -> CompleteLaravelSourceModel.relations
  -> RouteSyncManifest.sourceModel
```

Policy relations are retained in the canonical source-model relation graph,
which is the semantic manifest boundary. They are deliberately not converted
into service-graph edges: `manifestGraphCompiler` accepts only
`StructuralSemanticRelation` for graph projection.

This is intentional. Middleware and authorization are policy semantics, not
generic value-flow facts.

## Generic dataflow lane

```text
SemanticDataflowInput
  -> dependency/value_flow seeds
  -> astDataflowAuthority
  -> reaches closure
  -> SemanticDataflowJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> AstAnalysisInterface
  -> SsaSemanticInterface
```

`reaches` is never accepted as an input seed. The deprecated
`createSemanticDataflowInterface` implementation remains only as the authority
implementation/compatibility symbol; production consumers use the canonical
judgment-to-interface factory.

## E-commerce provenance

The old `examples/ecomerce-shop-source` and
`examples/ecommerce-shop-source` trees are absent. The maintained fixture is
`packages/sdk/tests/fixtures/ecommerce-shop-source`.

## Proof checks

The Phase 946 audit verifies:

- canonical upstream ownership;
- no reverse production ownership imports;
- policy relation construction and storage in the source model;
- source-model inclusion in the manifest;
- graph consumption through the structural-only filter;
- policy exclusion from generic dataflow;
- seed-only dataflow input and authority-owned `reaches` closure;
- canonical dataflow interface consumption by AST analysis and SSA;
- absence of legacy ecommerce source trees.
