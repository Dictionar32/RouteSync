# Phase 1615 — Interface-First Semantic Contract Audit

## Scope and non-goals

This phase is intentionally limited to auditing the existing contracts under `packages/core/src/types/upstream`. It does **not** change scanner wiring, composition roots, runtime executors, or move implementation code between files. No claim is made that the interface layer is complete after this audit.

## Findings

### 1. `astSemanticInterface.ts` is not interface-only

The same module declares the public `AstSemanticInterface` and also implements semantic evaluation:

- `ruleMatches()` evaluates rule premises against facts.
- `deriveRuleApplications()` selects applicable rules and creates derivations.
- `closeFacts()` runs iterative fixed-point closure.
- `astSemanticInterface` binds these implementations into the public capability.

This is a real boundary defect: a file named as an interface owns both the contract and the reasoning implementation. This phase records the defect but deliberately does not relocate the implementation because the instruction is to settle the interface first, not to move runtime code.

### 2. `semanticDecisionInterface.ts` exposes executable callbacks as contract data

`SemanticDecisionRule<Input, Output, Id>` contains `applies(input)` and `derive(input)` callbacks. Therefore the contract is not purely declarative: the rule catalogue embeds executable domain decisions. `SemanticDecisionProof` records rule order and receipts, but its type alone cannot prove that callback behavior is deterministic or that a selected output follows from the rule's declared semantic premises.

The interface design must decide what declarative evidence represents applicability and derivation before this can be migrated safely. Replacing callbacks without defining that vocabulary first would merely break consumers or move semantic reasoning elsewhere.

### 3. `requestTypeDerivationInterface.ts` has strong witness types but still relies on cross-field laws

The file defines a broad contract and proof vocabulary, including complete law coverage, source occurrences, derivation receipts, closure, verification, and integrity correlation. However, some invariants remain comments or relations between fields rather than constraints encoded by the result types themselves. Examples:

- closure counts are plain `number` values, so a `conflicted` closure can structurally claim `conflicts: 0`;
- an `incomplete` closure can structurally claim `unresolved: 0`;
- expected/accounted source counts are not type-level equalities;
- input/contract/judgment correlation is described by multiple packet types and still requires proof verification.

These are contract-design gaps, not a reason to add another gate or wire a gate into runtime now.

### 4. `semanticConstraintInterface.ts` and `semanticRewriteInterface.ts` duplicate protocol vocabulary

Both define request, derivation, closed/incomplete judgment and authority/runtime capability shapes for related rule/closure execution. Their closure labels are similar but not identical, and their shared invariants are not factored into a single existing contract vocabulary. This risks multiple representations of the same semantic guarantees. Any consolidation must be designed as a contract decision first; this phase does not perform a broad type migration.

### 5. `semanticTypeDerivationInterface.ts` mixes type declarations and executable contract guards

The module declares the derivation request, proof, judgment, authority and executor interfaces, but also implements `semanticTypeSourceEvidence()` and `assertSemanticTypeDerivationJudgment()`. The latter performs runtime integrity checking in a file that presents itself as an interface. That boundary needs an explicit ownership decision, but moving it before the contract is finalized would repeat the prior mistake.

## Required interface-first completion order

1. Establish a contract inventory for every existing upstream interface: evidence types, semantic knowledge, inference output, proof/witness, verification, closed/incomplete/conflict outcomes, and invariants.
2. For each contract, distinguish declarative semantic vocabulary from executable capability signatures. Do not treat a callback-bearing object as declarative merely because it is typed.
3. Encode result-state consistency wherever practical in discriminated unions and non-empty witness types; explicitly mark remaining runtime-verifiable laws rather than claiming TypeScript alone proves them.
4. Define canonical shared closure/proof vocabulary only after checking existing consumers and semantics; avoid adding parallel abstractions for the same concept.
5. Review the revised interfaces as a set and check their type relationships. Only after this review should implementation ownership, wiring, and runtime execution be changed.

## Verification

This phase is an interface audit only. It does not claim TypeScript build, Vitest, or runtime verification. No wiring/runtime source files were modified.
