# Phase 1716 — Static Incomplete Proof Witness Shape

## Interface-first trace

Phase 1715 declared that an incomplete proof must not contain a closure witness and that witnesses must follow canonical rule order. The actual `InvocationStaticIncompleteProofReceipt.witnesses` type still used an open-ended `...InvocationStaticSemanticRuleWitness[]` tail. That meant the type admitted duplicate rules, arbitrary ordering, and a closure witness despite the declared contract.

## Change

`packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` now defines `InvocationStaticIncompleteProofWitnessSequence` as a closed tuple union. It models unresolved-target proofs separately from resolved-target proofs with binding/effect obligations, retains rule order, and makes a closure witness unrepresentable in an incomplete proof. The receipt consumes that sequence directly. The new type is exported from `packages/core/src/index.ts`.

Proof-ledger contract version is now 2; authority validation/receipt version 4; aggregate judgment contract version 7; static model and coverage version 11; pipeline version 24.

## Scope boundary

This is a type-level contract correction only. No algebra, validator runtime, Laravel scanner wiring, or `semantic/foundation` dependency was added. Static invocation is not claimed to be implemented end-to-end.

## Verification

Run `npm run audit:phase1716-static-incomplete-proof-witness-shape`. Typecheck is reported separately by the implementation log; the repository-wide build is intentionally not run in this environment.
