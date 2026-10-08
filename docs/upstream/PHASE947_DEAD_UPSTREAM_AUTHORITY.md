# Phase 947 — Dead Upstream Authority Surface

The end-to-end proof in Phase 946 established that production analysis consumes the canonical upstream `semanticDataflowInterfaceFromJudgment` factory. The analysis authority therefore owns construction of the closed `SemanticDataflowJudgment`, not a second interface wrapper.

Phase 947 removes the unused `createSemanticDataflowInterface` / `createAstDataflowInterface` authority exports and renames the authority constructor to `createSemanticDataflowJudgment`. The canonical interface wrapper remains in `types/upstream/semanticDataflowInterface.ts`.

The historical `examples/ecommerce-shop-source` provenance is also normalized in active Phase documentation to the maintained regression corpus at `packages/sdk/tests/fixtures/ecommerce-shop-source`.

Invariant:

```text
scanner evidence
  -> SemanticDataflowInput
  -> createSemanticDataflowJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> AstAnalysisInterface
```

No production consumer may import the removed legacy authority interface factories.
