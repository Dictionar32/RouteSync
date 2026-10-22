# RouteSync Phase 1580 — Single-owner verification coverage contract

## Scope

This phase changes only `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`, and adds an audit, report, and this trace note. Scanner wiring, the current RequestType authority implementation, and runtime executor remain untouched.

## Trace

- `core/src/types/upstream/requestTypeDerivationInterface.ts` defines RequestType evidence, derivation judgment, verification, law coverage, decision proofs, and the target authority interface.
- `core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` still uses the existing derivation-context and group-aggregation path; it does not yet consume `RequestTypeDerivationSemanticAuthorityInterface`.
- `core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` still performs judgment/verification classification imperatively. It is a future migration target, not changed here.
- `core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` remains unchanged and is a distinct runtime boundary; the phase does not claim it is wired to this RequestType contract.

## Semantic model improvement

Phase 1579 put both `verification.verifiedLaws` and a second `coverage.verifiedLaws` record into successful decision proofs. Those fields had the same static shape but could disagree at runtime, creating two purported sources of truth for the same law ledger.

Phase 1580 gives the verified-law ledger one owner: the `RequestTypeDerivationVerification` witness. The successful coverage evidence now binds the contract and the valid verification together; successful decision premises carry the narrowed judgment plus that coverage object. Failure decisions retain their typed verification/counterexample evidence, while incomplete contract or verification coverage retains non-empty missing-law ledgers.

This removes a representational inconsistency, but does not make TypeScript's structural types a runtime proof checker. The future authority evaluator must still validate that every required contract law is present and that the verification's ledger matches the contract. Only after that evaluator is specified and tested should scanner wiring migrate; runtime simplification remains last.

## External design references

- TypeScript discriminated unions and exhaustiveness: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR generic interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR declarative rewrite rules: https://mlir.llvm.org/docs/DeclarativeRewrites/

These references support the use of explicit closed outcome variants and contracts that decouple generic consumers from implementation details. They are design references, not proof of RouteSync runtime correctness.
