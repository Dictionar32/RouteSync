# Phase 955 — Production Dataflow Ownership and E2E Wiring

## Canonical chain

```text
examples/ecommerce-shop-source/*.php
  -> StaticLaravelScanner / controller semantic construction
  -> ControllerSemanticDataflow.dataflow : SemanticDataflowInput
  -> compiler/analysis/semanticDataflowPipeline.ts
  -> createSemanticDataflowJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> SemanticDataflowInterface
```

The scanner does not import `compiler/analysis`. The analysis pipeline consumes only the canonical upstream `SemanticDataflowInput`.

## Ownership repairs

- `compiler/scanner/descriptors/route/routeMethods.ts` now imports relation primitives from `semantic/foundation`, not `semantic/kernel`.
- `semantic/kernel/semanticEvidenceRelations.ts` was moved to `compiler/scanner/semantic/semanticEvidenceRelations.ts` because it directly consumes scanner evidence.
- `semantic/kernel/syntax/relationalSyntaxCursor.ts` was moved to `compiler/scanner/lexer/routeAst/relationalSyntaxCursor.ts` because it directly consumes scanner lexer/route-AST types.
- No production `types/upstream` module imports compiler/scanner/graph/IR/kernel modules.
- The historical typo path `examples/ecomerce-shop-source` remains absent; the maintained `examples/ecommerce-shop-source` tree remains because it is an active physical source workload.

## Dataflow proof boundary

`semanticDataflowInputAdapter.ts` is now consumed by the controller semantic producer. The scanner emits canonical input but does not compute the fixed-point closure. `semanticDataflowPipeline.ts` is the downstream analysis authority boundary and closes the input through `createSemanticDataflowJudgment`, then reconnects the judgment to `SemanticDataflowInterface`.

The physical Laravel example is consumed by `ecommerceShopProductionDataflowPhase955.spec.ts`, which traverses the scanned controller contracts and sends their canonical dataflow inputs through the production analysis pipeline.

## Verification

`audit:phase955-production-dataflow-ownership` reports `clean: true` with:

- kernel → scanner reverse ownership: 0
- generic production imports from kernel facades: 0
- production reverse imports from `types/upstream`: 0
- canonical input production consumer: present
- judgment production pipeline consumer: present
- canonical interface production pipeline consumer: present
- physical example: present
- typo example: absent
- physical example E2E test: present

TypeScript compilation was not claimed green because this workspace has no installed `node` / `vitest` type definitions (`node_modules` is absent). Runtime Vitest execution therefore remains unverified in this checkpoint.
