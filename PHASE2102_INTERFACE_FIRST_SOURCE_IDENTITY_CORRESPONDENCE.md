# RouteSync Phase 2102 — Source Identity Correspondence Closure

## Change

The canonical controller declaration subject now includes the exact source identity from its invocation judgment. The declaration authority returns either a matched source-bearing selection or an explicit `controller_declaration_source_identity_mismatch` ADT arm. Mismatched candidates are excluded from ancestry evaluation and cannot enter action/response/AST execution.

## Why it matters

Phase 2101 kept source and selection in one value but did not validate that the candidate was actually derived from the same source identity. A single structural object is not sufficient if its correlated members can disagree. Phase 2102 closes that missing identity invariant before downstream execution.

## Files changed

- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts`
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts`
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.phase1968.test.ts`
- `scripts/audits/audit-phase2098-controller-scan-closed-outcome-adt.cjs`
- `scripts/audits/audit-phase2099-controller-declaration-gate-before-runtime-executor.cjs`
- `scripts/audits/audit-phase2100-controller-declaration-correspondence.cjs`
- `scripts/audits/audit-phase2101-source-bearing-declaration-correspondence.cjs`
- `scripts/audits/audit-phase2102-source-identity-correspondence-closure.cjs`
- `docs/traces/PHASE2102_INTERFACE_FIRST_SOURCE_IDENTITY_CORRESPONDENCE_TO_CLI.md`
- `docs/traces/PHASE2102_DEPENDENCY_IMPORT_INVENTORY.csv`

## Scope limits

This does not remove `semantic/relations`, `semantic/foundation`, or `subscanners`. The controller scanner and source AST pipeline still use relation helpers and subscanner implementations. Invocation/response/AST ADTs are preserved, not fully redesigned. Fixed-point numeric witnesses remain unproven by the type system. Static audits passed; build/typecheck/Vitest were not run.
