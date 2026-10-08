# Phase 938 — Upstream Dataflow Interface Trace

## Interface-first result

The canonical semantic dataflow contract remains `packages/core/src/types/upstream/semanticDataflowInterface.ts`. `SemanticDataflowInput` is the producer-to-solver contract.

The scanner-specific `SemanticKnowledgeDataFlow` vocabulary is confined to the scanner adapter at `packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts`. `compiler/analysis/astDataflowAuthority.ts` consumes only `SemanticDataflowInput`.

## Producer-neutral provenance

`SemanticDataflowOrigin.source` is `semantic_dataflow_input`, not the scanner implementation name `semantic_knowledge_data_flow`. This prevents the upstream contract from leaking the concrete producer vocabulary.

## Legacy analyzer

`compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts` remains only as a historical/test compatibility surface. Its barrel export was removed so it cannot become a production authority through `routeAst/index.ts`.

## Example corpus

Neither `examples/ecomerce-shop-source` nor `examples/ecommerce-shop-source` exists. No missing application tree is recreated. Test-owned fixtures remain under `packages/sdk/tests/fixtures/ecommerce-shop-source/`.

## Boundary

```text
source evidence
  -> scanner semantic knowledge
  -> SemanticDataflowInput
  -> generic semantic dataflow authority
  -> least-fixed-point judgment
  -> path/graph projections
```

Laravel-specific route/controller/resource middleware and policy relations remain separate semantic relations. They are not folded into the generic dataflow fact algebra.
