# Phase 2098 — Controller Scan Closed Outcome ADT

## Objective

Continue interface-first work after the Phase 2097 source trace. The narrow defect addressed here was a contract mismatch: `LaravelControllerScanJudgment` allowed a blocked declaration-selection inventory to carry and publish controller AST artifacts.

## Changes

1. `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
   - Replaced the single scan-result interface with a closed discriminated union.
   - `laravel_controller_scan_complete` requires complete declaration closure and may publish controller artifacts.
   - `laravel_controller_scan_blocked` requires blocked declaration closure and exposes `controllers: readonly []`.
   - Advanced scanner contract version from 26 to 27.
   - The interface adds no relation, foundation, or subscanner imports.
2. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
   - Runtime now returns the complete branch only when the declaration blocker list is empty.
   - If any declaration blocker exists, it returns the blocked branch and publishes no controller AST artifacts.
   - Advanced implementation contract version to 27.
3. `scripts/audits/audit-phase2098-controller-scan-closed-outcome-adt.cjs`
   - Added a static audit for branch correlation, artifact suppression on blocked closure, version alignment, and absence of legacy imports in the upstream interface.

## Why this is a semantic correction

The prior shape had a `declarationSelection` union alongside an unconstrained `controllers: readonly LaravelControllerScanArtifact[]`. Consumers could receive `controller_declaration_selection_inventory_blocked` and still observe artifacts from otherwise resolved controllers. That combination violated the stated closed prerequisite that declaration ancestry must be closed before controller AST publication.

The new result ADT makes that invalid combination unrepresentable at the type boundary and suppresses the artifacts at runtime. This is not a claim that the controller scanner has been migrated away from old implementation dependencies.

## Remaining work / explicit non-claims

- `laravelControllerScanner.ts` still imports `semantic/relations` and controller subscanner producers.
- `laravelSourceAstPipeline.ts`, `laravelRouteScanner.ts`, and `laravelResourceScanner.ts` still require separate interface-first migration.
- No `semantic/relations`, `semantic/foundation`, or `subscanners` directories/files were deleted.
- Invocation judgment branches still share a top-level `kind`; their integrated response remains correlated through the nested response ADT. This phase does not claim to have completed that broader redesign.
- The ancestry fixed-point witnesses (`heightBound`, `rounds`, `knownAncestors`) remain primitive numeric runtime witnesses; TypeScript does not prove their arithmetic laws.
- Build, typecheck, and Vitest were not run.

## Related design references

- TypeScript interfaces as structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions/narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR interfaces for generic compiler transformations over IR: https://mlir.llvm.org/docs/Interfaces/
- MLIR language reference and extensible operation model: https://mlir.llvm.org/docs/LangRef/
