# Phase 1467 — Runtime Structure Delegation

## Source trace

`packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts` contained three local structural algorithms: `splitTopLevel`, `matchingClose`, and `matchingBrace`. They reasoned about delimiter depth in the runtime even though `ScannerTokenStructureInterface` and its algebra already define the canonical delimiter/top-level evidence boundary.

## Change

- `splitTopLevel` now consumes `locateTopLevelCandidates` and only projects evidence boundaries to slices. It no longer maintains its own recursive depth counter.
- `matchingClose` and `matchingBrace` now consume `matchLeadingDelimiter` and project the matching delimiter evidence back to a runtime index. They no longer own recursive scanning.
- `classifyMatch` remains a projection of `ScannerMatchExpressionAlgebra` judgments into AST nodes; it does not parse arms itself.

## Pipeline

`TokenDescriptor source evidence → ScannerTokenStructureInterface → ScannerTokenStructureAlgebra judgment → runtime index/slice adapter → AST projection`.

The match-specific path is `source evidence → ScannerMatchExpressionAlgebra → closed match judgment → runtime wiring → PhpAstFactory projection`.

## Boundary note

Runtime adapters retain only compatibility-shaped index/slice projections because existing callers consume indices and arrays. A malformed delimiter judgment is not converted into fabricated boundaries: the split adapter preserves the unsplit token sequence so the existing downstream classifier can reject/decline the candidate instead of manufacturing empty segments. Future migration should upgrade callers to consume closed delimiter judgments directly, then remove these adapters.

## Verification

Run `node scripts/audits/audit-phase1467-runtime-structure-delegation.cjs`. Full package build remains dependent on repository dependencies being installed.
