# Phase 2101 — Interface-First Source-Bearing Correspondence

This phase replaces positional declaration/selection array pairing with a source-bearing correspondence ADT.

Changed production files:

- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts`
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts`
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
- `packages/core/src/index.ts`

Updated verification files:

- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts`
- `scripts/audits/audit-phase2100-controller-declaration-correspondence.cjs`
- `scripts/audits/audit-phase2101-source-bearing-declaration-correspondence.cjs`

Full trace: `docs/traces/PHASE2101_INTERFACE_FIRST_SOURCE_BEARING_CORRESPONDENCE_TRACE_TO_CLI.md`.

Static audits: 12/12 + 12/12 passed. Build, typecheck, and Vitest were not run.

This phase does not remove `semantic/relations`, `semantic/foundation`, or `subscanners`; the controller scanner still depends on relation helpers and subscanner implementations.
