# Phase 1466 — Match semantic reasoning extraction

## Boundary moved

`scannerMatchExpressionAlgebra` now owns match-expression applicability, subject/body delimiter evidence, top-level arm and condition partitioning, arrow cardinality, default-arm uniqueness, malformed-source judgments, and source-partition invariant checks. It depends on `ScannerTokenStructureInterface` instead of maintaining an independent delimiter scanner.

`astClassifierRuntime.classifyMatch` now delegates structural reasoning to the upstream algebra and only projects a resolved judgment into `PhpAstFactory` AST nodes. It does not split match arms or locate `=>` itself.

## Authority flow

Source token evidence → `ScannerTokenStructureInterface` evidence → `ScannerMatchExpressionAlgebra` reasoning → closed `ScannerMatchExpressionJudgment` → runtime wiring → AST projection.

## Deliberate boundary

Malformed source returns a closed malformed judgment and is not treated as a contract violation. The runtime currently maps malformed match judgments to the existing unsupported/not-derived path to preserve the scanner's prior non-throwing behavior. A violated internal evidence invariant throws at the runtime boundary rather than silently constructing an AST.

## Validation

Run `npm run audit:phase1466-match-semantic-reasoning-extraction` and the focused Vitest test `scannerMatchExpressionAlgebra.phase1466.test.ts`. Full build requires the repository's declared build dependencies to be installed.
