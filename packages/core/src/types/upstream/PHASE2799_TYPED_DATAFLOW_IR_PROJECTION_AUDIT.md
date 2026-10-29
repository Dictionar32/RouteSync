# Phase2799 — Typed Dataflow IR Projection Audit

## Scope
This phase continues the CLI manifest runtime trace into the semantic dataflow IR projection. It removes the exported `projectSemanticDataflowToIR(...)` function alias and migrates callers to the existing `SemanticDataflowIRProjectionInterface` operation object.

## Runtime trace

```text
CLI scan.ts / sync.ts
  -> routeSyncManifestDataflowAnalysisOperations.analyze(...)
  -> closed semantic dataflow authority interface
  -> semanticDataflowIRProjection.project(dataflowInterface)
  -> SemanticDataflowIRProjection
  -> IR graph / downstream consumers
```

The projection reads `dataflow.state.closure` and its existing authority metadata. It does not calculate closure or introduce a reasoning primitive. The domain alternatives `dependency`, `value_flow`, and `reaches` remain explicitly projected by `relationOf`.

## Existing contract-first decision
`packages/core/src/compiler/ir/SemanticDataflowIRProjectionInterface.ts` already defines the correct downstream contract. No new upstream interface or ADT was needed. This operation consumes compiler IR and `DataFlowAuthorityInterface`, so keeping its contract next to the IR implementation avoids making `types/upstream` depend on downstream concrete projection types.

## Migration
- Removed the exported `projectSemanticDataflowToIR` function value.
- `semanticDataflowIRProjection` now owns the typed `project` implementation directly.
- Migrated CLI scan, CLI sync, and `scripts/scan-toko-online.ts` to `.project(...)`.
- Updated core and IR barrel exports.
- `packages/core/src/types/upstream/collections.ts` remains 0 bytes.

## Verification
Run `npm run audit:phase2799-typed-dataflow-ir-projection`. This is a structural source audit, not a full TypeScript build or end-to-end test.
