# Phase 1454 — Statement Control Kind Contract

## Pipeline

`Source token evidence → semantic reasoning algebra → closed judgment/contract → interface → runtime wiring → AST executor → downstream projection`.

## Trace and change

- `ScannerStatementControlInterface` defines the closed `structured | not_structured` judgment and the seven supported control kinds.
- `scannerStatementControlContractAlgebra` owns the keyword-to-control-kind reasoning and preserves the leading token as evidence.
- `astClassifierRuntime.ts` consumes that judgment before selecting the existing AST construction rule. It no longer imports or invokes the runtime-local `phpControlEvidence` classifier.
- `phpControlEvidence.ts` remains as a compatibility facade only and delegates to the canonical algebra; it no longer owns a second keyword table.
- The statement boundary contract, sequence traversal, and AST constructors are intentionally unchanged in this phase.

## Scope boundary

This phase migrates control-kind recognition, not the grammar/parsing of `if`, loops, `switch`, `try/catch/finally`, or `throw`. Those parsers still use local cursor/range logic. The next step is to define a meaningful structured-statement parse judgment that preserves continuation evidence (for example `else`, `catch`, and `finally`) before migrating those functions; do not wrap the old parser in a cosmetic interface.

## Verification

Run `node scripts/audits/audit-phase1454-statement-control-kind-contract.cjs`. The focused TypeScript check covers the new interface and algebra. Full build and runtime tests must be reported separately; a static audit does not prove AST projection equivalence.
