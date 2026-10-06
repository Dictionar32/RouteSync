# Phase 1117 — TypeExpression Upstream → Wiring → Interface → Downstream

## Canonical ownership

`TypeExpression` and `PrimitiveVocabulary` remain upstream semantic vocabulary in `types/upstream/typeVocabulary.ts` and `types/upstream/primitiveVocabulary.ts`.

`TypeExpression -> SemanticType` lowering is semantic/domain-owned at `types/domain/typeExpressionSemanticType.ts`, with its declarative projection relations at `types/domain/typeExpressionSemanticRelations.ts`.

The former `compiler/domain/common/typeExpressionSemanticType.ts` and `typeExpressionSemanticRelations.ts` are compatibility facades only. They do not own semantic classification.

## Dependency direction

```text
source evidence
  -> types/upstream/typeVocabulary
  -> types/domain semantic vocabulary/lowering
  -> compiler/scanner/wiring and compiler adapters
  -> DataFlowInterface / InterfaceDependencyBoundary
  -> graph / IR
  -> CLI commands
```

`types/domain` and `types/upstream` must not import `compiler/*`. Semantic plugins may consume canonical domain lowering, but must not depend on compiler implementation modules.

## DataFlowInterface

`DataFlowInterface<Input, State, Node>` remains generic. Laravel-specific source/sink/barrier/policy semantics belong to analysis configuration and semantic inputs, not the generic execution contract.

## InterfaceDependencyBoundary

`InterfaceDependencyBoundary<Upstream, Downstream>` remains downstream-owned and directional. Upstream contracts must not import or implement it merely for consumption.

## Legacy

`StaticLaravelScanner` and the retired `compiler/scanner/upstream` lane have no production TypeScript references. Historical phase documentation is not treated as production dependency.

## Regression oracle

`examples/ecommerce-shop-source` remains the end-to-end source fixture for route/controller/model-relation/resource/schema preservation.
