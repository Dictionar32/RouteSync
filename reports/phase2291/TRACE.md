# Phase 2291 Trace — Attribute Declaration-to-Resolution Lineage

## Changed

- `packages/core/src/types/upstream/laravelAttributeScannerInterface.ts`
  - contract version 8 → 9;
  - introduced source declaration evidence and a closed source-linked resolution inventory;
  - linked each resolved interface to its source declaration;
  - used one paired collection to avoid parallel-array mismatches;
  - replaced duplicate implementation proof source span with the source declaration evidence reference.
- `packages/core/src/types/upstream/docs/PHASE2291-ATTRIBUTE-DECLARATION-RESOLUTION-LINEAGE.md`
- `scripts/audits/audit-phase2291-attribute-declaration-resolution-lineage.cjs`

## Not changed

- `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/attributeProducer.ts`
- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
- CLI and runtime

## Known next integration work

The implementation still emits `resolvedInterfaces` and contract version 7, while the upstream contract now requires `interfaceInventory` and version 9. `attributeProducer.ts` still imports `semantic/relations`. Both are explicit follow-up tasks; neither is claimed fixed here.

## Validation status

- Structural audit: run separately; all checks must pass.
- `node --check`: run separately.
- TypeScript typecheck/build: not run.
