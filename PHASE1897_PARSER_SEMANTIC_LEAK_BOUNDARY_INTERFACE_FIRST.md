# Phase 1897 — Parser Semantic-Leak Boundary (Interface First)

## Baseline

Built from `RouteSync-phase1896-parser-caller-disposition-contract-interface-first-20261014.zip`.

## Trace finding

The earlier label `structural_ast_consumer` described caller intent, not the full parser execution path. `parseControllerDeclaration` forwards `filePath` and `integratedResponse` to `parseControllerMethod`; `parseControllerMethod` then forwards both into `parseControllerBody`. The legacy default is an explicit `not_connected` integrated response, but this still means those consumers execute method-body projection under that response state. They cannot honestly be described as proven syntax-only consumers yet.

The traced production callers are:

- `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/providerAstCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/middlewareAstCanonical.ts`
- `packages/core/src/compiler/scanner/subscanners/responseScanner.ts`

The canonical controller scan continues to use `parseControllerDeclarationFromInvocationJudgment` with one `LaravelControllerInvocationSemanticJudgmentInterface`.

## Interface change

Advanced the existing `LaravelControllerInvocationSemanticBoundaryContract` from v63 to v64. Added `legacyParserSemanticLeakBoundary` and `structuralProjectionRetirementGate` to record the actual parser flow and require field-level consumer tracing before splitting syntax-only AST projection from method-body semantic projection.

No new judgment model, no V2 family, no `semantic/foundation`, and no runtime edits were introduced. This phase deliberately corrects the contract before wiring changes. Next phase should trace the exact AST fields consumed by each producer and define the smallest syntax-only projection contract that preserves those fields.

## Verification scope

The phase audit is static. It does not run TypeScript compilation or a package build.
