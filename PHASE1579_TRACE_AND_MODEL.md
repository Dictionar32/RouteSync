# RouteSync Phase 1579 — Proof-carrying semantic authority interface

## Scope boundary

This phase strengthens only `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` and adds an audit/report/trace note. It deliberately does not change scanner wiring, the current semantic authority implementation, or the runtime executor.

## Trace of current ownership

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` owns source evidence, derivation judgment, verification counterexamples, law coverage, and the target semantic authority interface.
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` currently takes routes/resources/requests, creates a `DerivationContext`, and returns `aggregateRequestTypeGroups(...)`; it does **not** consume `RequestTypeDerivationSemanticAuthorityInterface` yet.
- `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` remains the current aggregation implementation; unchanged.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` separately derives a judgment, verifies it, checks law coverage, and calls imperative `classifyAuthorityResult()`; unchanged and remains a migration target. The trace does not assume this authority is already wired into `RequestTypeDeriver`.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` is a separate semantic-type-derivation boundary that delegates through `SemanticTypeDerivationAuthorityInterface.resolve(...)`; unchanged. It is not silently treated as the RequestType authority. Runtime migration remains last.

## Model improvement

Phase 1578's decision proofs represented premises mainly as semantic labels (`judgmentKind`, `verificationKind`, `coverageKind`). Phase 1579 replaces those labels on the decision paths with the actual typed `judgment`, `verification`, and coverage evidence. Successful decisions require a matching judgment variant, valid verification, and a complete coverage witness. Failure decisions carry typed verification counterexamples; rejection decisions carry both the rejected judgment and its rejection witness; coverage failures carry explicit missing-law evidence.

The assessment no longer duplicates judgment and verification alongside the proof. The decision proof is the single carrier of those premises, avoiding a second pair of fields that could drift from the proof. The outcome remains a discriminated union, so derivation closure, verified incompleteness, conflict, rejection, failed verification, and authority inconsistency stay distinct.

This is still a type-level contract. It does not prove that the runtime constructs valid proofs, nor does it imply that scanner consumers use this interface. That requires a later evaluator implementation and separate wiring migration.

## External references

- TypeScript Handbook — Narrowing and discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript Handbook — Unions and intersections / exhaustiveness: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/

The TypeScript references support outcome variants and exhaustiveness. MLIR's interface model supports decoupling generic analyses from concrete implementation details, while declarative rewrite rules support expressing transformations as explicit rules. These are design references, not evidence that RouteSync is already wired or sound at runtime.

## Validation limits

`PHASE1579_AUDIT.json` is a structural audit of the contract and hashes of files that must remain untouched. Syntax transpilation is checked separately. Full package build and whole-project strict type-check are not claimed unless independently run successfully.
