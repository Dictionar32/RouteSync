# Phase 2986 — Scanner Control Domain Operations

## Purpose

Raise PHP structured-statement recognition into an upstream domain model. Keep the public runtime entry as an interface-typed object, and move token-presence and keyword-recognition continuation into private, domain-owned judgments rather than importing the deleted generic relation foundation.

## Implementation

- `packages/core/src/types/upstream/scannerStatementControlAlgebra.ts`
  - Removed imports from `semanticRelations` and `relationalSequence`.
  - Added private `TokenEvidenceJudgment` and `ControlKeywordJudgment` ADTs. Each provides `continueWith(...)` so downstream construction follows a domain result rather than interpreting a generic relation option.
  - Added a domain-owned keyword index mapping PHP spellings (`if`, `foreach`, `for`, `while`, `switch`, `try`, `throw`) to semantic control kinds.
  - Runtime entry remains `export const scannerStatementControlContractAlgebra: ScannerStatementControlInterface = Object.freeze({ resolve: resolveControlEvidence })`.
- `packages/core/src/compiler/frontend/php/astClassifierRuntime.ts` already consumes `scannerStatementControlContractAlgebra`; no consumer rewrite was needed for this operation.

## Runtime trace

```text
PHP source
  ↓
PHP tokenizer / TokenDescriptor evidence
  ↓
astClassifierRuntime.ts
  ↓ scannerStatementControlContractAlgebra.resolve(query)
  ├─ TokenEvidenceJudgment.continueWith(...)
  └─ ControlKeywordJudgment.continueWith(...)
  ↓
ScannerStatementControlJudgment
  ├─ structured(control, evidence)
  └─ not_structured(evidence?)
  ↓
AST classification / structured statement interpretation
  ↓
Upstream semantic results consumed by compiler and later manifest / IR paths
```

This trace establishes the scanner-control call edge. It does **not** prove that every upstream result is preserved through CLI, manifest, and IR; that end-to-end path still requires separate consumer tracing.

## Remaining blockers

- `packages/core/src/compiler/frontend/php/phpControlEvidence.ts` still imports `RelationOption` and `relationOptionFold` from the deleted `relationalSequence` foundation. It is a remaining compatibility boundary, not fixed by this phase.
- The scanner has other relation imports outside this control-algebra file, including in `astClassifierRuntime.ts`; this phase does not claim to remove them all.
- The historical `/mnt/data/build.log` records 230 unresolved imports in an earlier workspace snapshot. It is not a Phase 2986 build result.
- `collections.ts` remains empty. The deleted `relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` foundations are not restored.

## Verification

- Structural audit: `scripts/audits/audit-phase2986-scanner-control-domain-operations.cjs`.
- Strict TypeScript check passed for `scannerStatementControlInterface.ts` and `scannerStatementControlAlgebra.ts`.
- Syntax transpilation and runtime smoke checks are scoped to changed scanner-control code; full repository typecheck, build, and test suite remain unverified because dependencies are absent.
