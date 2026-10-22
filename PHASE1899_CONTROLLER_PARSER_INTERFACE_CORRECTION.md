# Phase 1899 — Controller Parser Interface Correction

## Correction

- Removed the `LaravelControllerLegacyParserAstFieldInventory` and its exported constant. It recorded consumed fields as metadata but did not change parser ownership or execution.
- Renamed the parser call-site disposition contract to `LaravelControllerStructuralParserCallSiteDisposition`. Structural consumers are not automatically a legacy semantic path merely because they use the independent-argument syntax parser.
- Advanced the existing `LaravelControllerInvocationSemanticBoundaryContract` from version 65 to 66.
- Preserved the canonical `LaravelControllerInvocationSemanticJudgmentInterface`: `sourceFile` and the outcome-indexed integrated `response` remain correlated in one judgment. The production controller scanner continues to call `parseControllerDeclarationFromInvocationJudgment` with that exact judgment.
- No dependency on `semantic/foundation` was added.

## Trace finding still open

`parseControllerDeclaration` forwards `filePath` and `integratedResponse` through `parseControllerMethod` into `parseControllerBody`. Consequently, structural consumers still trigger body dataflow analysis even though they only need syntax fields. This phase does **not** claim that leak is fixed; the next implementation must introduce a real syntax-only AST projection and migrate the four structural consumers to it, without creating another invocation-judgment model.

## Validation

Run `node scripts/audits/audit-phase1899-controller-parser-interface-correction.cjs`. This phase does not run a package build or TypeScript compilation.
