# Phase 960 — Semantic Dataflow Downstream IR Consumption

The internal trace found a real downstream gap after Phase 959: `SemanticDataflowInterface` was consumed by manifest analysis and CLI JSON serialization, but `packages/core/src/compiler/ir` did not consume the canonical interface. The existing `routesync.ir.json` registry was also independently allocated by the CLI and could remain empty.

Phase 960 adds one downstream authority-preserving projection:

`SemanticDataflowInterface` → `projectSemanticDataflowToIR()` → `SemanticDataflowIRProjection` → CLI `routesync.dataflow.ir.json`.

The projection reads only `interface.judgment.closure`; it does not construct a judgment, recompute reachability, or read scanner implementation types. Therefore the authority remains `createSemanticDataflowJudgment()` and the upstream contract remains `types/upstream/semanticDataflowInterface.ts`.

## Canonical internal path

`examples/ecommerce-shop-source` → Laravel scanner → semantic knowledge dataflow → `SemanticDataflowInput` → `SemanticDataflowJudgment` → least-fixed-point closure → `SemanticDataflowInterface` → `analyzeRouteSyncManifestDataflow()` → `projectSemanticDataflowToIR()` → CLI `routesync.dataflow.ir.json`.

## Ownership invariants

- `types/upstream` production reverse imports into compiler/scanner/IR/graph/kernel: 0.
- `semantic/kernel` imports from scanner: 0.
- IR projection consumes the canonical interface only.
- IR projection never creates a dataflow judgment.
- IR projection never recomputes transitive closure.
- CLI scan and sync both consume the IR projection.
- The physical ecommerce example remains the production E2E fixture.

The existing generic `routesync.ir.json` remains a separate legacy Stage-2 artifact and is not silently redefined as dataflow IR. The new `routesync.dataflow.ir.json` is the explicit downstream dataflow projection.
