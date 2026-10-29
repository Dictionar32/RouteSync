# Phase 2814 — Interface-First PHP Scanner Runtime Audit

## Goal

Remove exported standalone function declarations from the selected PHP expression-scanner runtime boundary and expose the existing responsibilities as explicitly typed, frozen operation objects. Reuse the existing upstream expression-candidate ADT and preserve its `continueForAstClassification` operation; this phase adds no generic reasoning/visitor primitive and no parallel upstream ADT.

## Runtime trace

```text
CLI scan.ts / sync.ts
  -> manifestScanOperation.scan(input)
  -> controller invocation manifest composition
  -> manifest request-resolution preflight
  -> source scan / PHP scanner wiring
  -> astClassifierEvidenceInterface.classify(...)
  -> phpAstClassificationRuntime.classifyTokens(...) / classifyBlock(...)
  -> scannerAstExpressionCandidateContractAlgebra.resolve(...)
  -> ScannerExpressionCandidateJudgment.continueForAstClassification(...)
  -> expression classification rules
  -> source-located AST / semantic evidence
  -> manifest projection, validation, serialization and persistence
```

This phase changes the PHP scanner runtime API boundary and the two expression evidence providers it calls. It does not claim to change the manifest composition or persistence contracts.

## Existing contract review

- `scannerAstExpressionCandidateInterface.ts` already owns the closed `not_applicable | resolved` judgment and its domain continuation operation.
- `scannerAstExpressionCandidateAlgebra.ts` constructs the immutable judgment variants.
- `scannerExpressionJudgmentInterface.ts` owns the expression-structure judgment shape; this phase does not create a duplicate judgment contract.
- `astClassifierEvidenceContract.ts` remains the scanner-facing port used by the runtime adapter.
- `packages/core/src/types/upstream/collections.ts` remains zero bytes.

## Interface-first operations

- `phpAstClassificationRuntime: PhpAstClassificationRuntimeInterface`
- `phpExpressionStructureEvidenceProvider: PhpExpressionStructureEvidenceProviderInterface`
- `phpExpressionRootOperatorResolver: PhpExpressionRootOperatorResolverInterface`

Each is exported as `export const name: ExistingOrDeclaredInterface = Object.freeze({...})`. The implementation details are private functions/closures; call sites use the operation object. Existing domain `switch` statements remain where they eliminate distinct ADTs (for example structured/malformed/contract-violation expression judgments). They are not mechanically removed.

## Verification scope

Run `npm run audit:phase2814-interface-first-php-scanner-runtime` for static architecture checks. A passing audit does not establish full TypeScript typecheck, production build, complete tests, or CLI scan/sync E2E unless those are run separately and recorded.
