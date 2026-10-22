# Phase 1618 — Interface-first semantic rule unification contract

## Goal

Strengthen the existing semantic-decision contract before any scanner, wiring, algebra, or runtime-executor migration. This phase changes only the existing upstream interface, its interface contract fixture, its structural audit, and this report.

## Trace

### `packages/core/src/types/upstream/semanticDecisionInterface.ts`

Phase 1617 introduced declarative rule atoms but left rule terms as opaque generic values. That did not define how rule variables bind to evidence, how repeated variables agree, or how proof receipts establish the exact match that licensed a conclusion. The proof was bound to a source snapshot but not to an explicit evidence fact-set identity or canonical rule-set identity.

### `packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts`

The scanner still constructs callback rules through `expressionRule(...)`. This remains a production migration target. It is intentionally untouched: the declarative contract must be mature before consumer migration.

### `packages/core/src/types/upstream/semanticDecisionAlgebra.ts`

The current algebra still consumes the deprecated callback contract. It is intentionally untouched. Phase 1618 does not claim the declarative authority is wired into production.

### `packages/core/src/types/upstream/astSemanticInterface.ts`

The AST closure contract remains a separate gap. Its current certificate (`stableFacts`, `rulesExhausted`) does not bind the exact closure request, seed snapshot, or rule-set identity. It is intentionally untouched in this phase to keep the patch focused on the existing semantic-decision interface.

## Interface changes

The existing `semanticDecisionInterface.ts` now declares:

- canonical ground terms with stable term identities;
- explicit named variable terms in rule patterns;
- separate ground evidence atoms and pattern-bearing rule atoms;
- structural-unification laws, including per-application variable scope and repeated-variable identity equality;
- a law that conclusion variables must be bound by premises;
- canonical rule-set identity and evidence fact-set identity, in addition to source and snapshot identities;
- per-premise witness data tied to the exact rule premise, evidence fact, and substitution;
- a complete proof receipt ledger contract;
- an authority proof-verification operation that verifies the supplied assessment without rerunning executable rule callbacks;
- separate closed outcomes for derivation, no derivation, conflict, incompleteness, and contract rejection.

The callback-bound `SemanticDecisionRule` and `SemanticDecisionContract` remain explicitly deprecated for compatibility. They have not been removed or migrated in this interface-only phase.

## Validation

- Strict TypeScript check of `semanticDecisionInterface.ts`: passed using available TypeScript 5.8.3.
- Structural audit: passed, including checks for variable patterns, rule-set and fact-set binding, and proof-verification contract.
- Scanner/algebra/runtime/wiring source files: unchanged from Phase 1617.
- Full package build and Vitest: not run because dependencies are not installed in this workspace.

## What this does not prove

Type declarations specify obligations; they do not themselves prove that an implementation performs correct unification, hashes identities correctly, validates witnesses, or checks proof completeness. Those laws must later be implemented and tested by the semantic authority after the contract is accepted. This phase does not claim production cutover or full upstream interface completion.

## Reference design

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — interfaces let generic compiler passes work through stable contracts instead of hardcoding each operation's semantics.
- TypeScript Handbook, Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions and exhaustive checks help make semantic outcomes explicit, but do not prove runtime semantic truth.

## Canonical interface cutover

Phase 1618 also promotes the declarative contract to the canonical `SemanticDecisionInterface<Id, Relation, Term>` in the existing interface file. The former callback-based `resolve`/`verifyProof` shape is now named `SemanticDecisionCallbackCompatibilityInterface` and explicitly deprecated. `SemanticDecisionAuthorityInterface` is retained as a descriptive type alias to the canonical interface.

This is an intentional interface-first contract boundary change. `semanticDecisionAlgebra.ts` still annotates its callback implementation with the former `SemanticDecisionInterface` name, so a targeted type-check correctly reports that the consumer has not yet migrated. The algebra, scanner, wiring, and runtime executor were not edited to conceal this incompatibility. The next implementation stage must enforce the new contract in the semantic algebra after the remaining upstream contract audit is complete.
