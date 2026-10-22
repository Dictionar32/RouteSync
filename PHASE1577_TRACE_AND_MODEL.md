# Phase 1577 — Semantic Authority Interface Contract (Interface Only)

## Objective

Improve the semantic authority model before wiring or executor work. The interface must express the inference relation that turns source judgment plus verifier evidence into a trusted authority assessment. Runtime code must not own that semantic classification.

## Trace findings

- `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` already defines source evidence, derivation policy, source receipts, proof closure, typed counterexamples, verification outcomes, and a runtime-facing authority outcome.
- The existing `RequestTypeDerivationAuthorityOutcome` describes the result variants, but by itself does not name the inference rule or carry the premises that justify a particular result.
- `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` still has `classifyAuthorityResult()` with conditional branches that classify judgment/verification combinations and compare rejection reason/evidence. This remains a semantic-reasoning frontier, not merely mechanical dispatch.
- `packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` and `packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` still own the active derivation path. They were deliberately not changed in this phase.
- `packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` was deliberately not changed. Executor simplification belongs after the semantic contract and its implementation are established.

## Interface model added

The upstream contract now declares:

- `REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS`: canonical registry of nine authority inference rules.
- `RequestTypeAuthorityDecisionRuleCoverage`: exhaustive mapped coverage of those rules.
- `RequestTypeAuthorityDecisionProof`: a discriminated algebra of premises and conclusions for verified, rejected, failed-verification, and inconsistent assessments.
- `RequestTypeDerivationSemanticAuthorityAssessment`: one closed result that couples the judgment, verification, and decision proof. Consumers no longer need to infer the authority outcome from two independent discriminants.
- `RequestTypeDerivationSemanticAuthorityInterface`: target interface with one `evaluate(input)` operation returning the closed assessment.

The previous `RequestTypeDerivationAuthorityInterface` is explicitly marked transitional/deprecated. It remains present to avoid pretending that the implementation has already migrated to the new interface.

## Scope boundary

This phase changes only the upstream interface model and its audit/documentation. It does **not** implement the semantic evaluator, change `classifyAuthorityResult()`, wire the scanner, or modify the runtime executor. The new interface is a target contract, not a claim that the current implementation already satisfies it.

## Verification

- Phase 1577 interface structural audit: 10/10 passed.
- Phase 1576 authority behavior regression: 10 cases passed.
- Phase 1576 structural regression: 14/14 passed.
- Targeted `tsc --noEmit --strict` exits 2 because of 35 existing diagnostics in imported dependency modules; zero diagnostics mention `requestTypeDerivationInterface.ts`.
- Full build/Vitest were not run because this workspace has no `node_modules`.

## External design references

- TypeScript Handbook, Narrowing / discriminated unions: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
  - Supports closed result variants and exhaustively distinguishable states; it does not by itself move semantic reasoning out of runtime.
- MLIR Declarative Rewrite Rules: https://mlir.llvm.org/docs/DeclarativeRewrites/
  - Shows how rule premises/patterns and conclusions can be specified declaratively, separately from the generated implementation.
- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
  - Supports consumers depending on stable contracts rather than concrete implementation details.

These references inform the model. They do not certify RouteSync correctness.
