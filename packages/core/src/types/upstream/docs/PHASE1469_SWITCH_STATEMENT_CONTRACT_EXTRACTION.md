# Phase 1469 — Switch Statement Contract Extraction

## Ownership

`ScannerSwitchStatementInterface` describes source evidence and closed outcomes. `scannerSwitchStatementContractAlgebra` owns delimiter matching, case/default boundary discovery, label partitioning, malformed-case detection, and break evidence. `astClassifierRuntime.ts` delegates to the algebra and only projects subject, labels, and case bodies into AST values/blocks.

## Flow

Source token evidence → typed switch evidence → semantic reasoning algebra → closed judgment → public interface contract → runtime wiring → AST projection.

## Verification limits

The static audit verifies ownership boundaries and public exports. Focused Vitest tests cover case partitioning, default, empty subject, missing separators, and duplicate defaults. Run the focused Vitest test and full package build in an environment with the repository's dependencies installed before claiming end-to-end compilation success.
