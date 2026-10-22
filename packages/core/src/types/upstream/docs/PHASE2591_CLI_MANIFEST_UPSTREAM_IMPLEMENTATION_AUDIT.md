# Phase 2591 — CLI → Manifest → Upstream Implementation Audit

## Source corrections

- The canonical `REQUEST_TYPE_DERIVATION_LAW_IDS` inventory contains **34 unique laws**. Current-path documentation that says 32 is inaccurate and must not drive verifier implementation or completion claims.
- The existing canonical owner remains `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- The existing operation chain remains `RequestTypeDerivationSemanticReasoningInterface.infer` → `RequestTypeDerivationProofVerificationInterface.verify` → decision → authority/integrity → `RequestTypeDerivationSemanticPipelineInterface`.
- `requestTypeDerivationSemanticPipelineAssembler.ts` already connects those capabilities; it is wiring, not the semantic producer.
- `upstreamCompositionFactory.ts` already wires the assembled pipeline to manifest composition. The executable CLI entry still calls `createProgram()` without a composition.

## Root cause

The active path has interface/ADT definitions and composition wiring, but no production semantic reasoning implementation that constructs a source-bound judgment, disposition receipts, contribution receipts, closure ledger and proof, plus an independent verifier that establishes all **34** canonical laws. The executable composition root also does not supply the complete composition.

This is not an `export const` naming problem. Adding a duplicate interface, wrapping legacy `RequestType[]` as `derived`, or marking all law statuses as verified would fabricate semantic authority. Those shortcuts are explicitly rejected.

## Correct next implementation boundary

1. Implement a named `export const` producer against the existing `RequestTypeDerivationSemanticReasoningInterface` in the semantic request-type derivation owner.
2. Preserve canonical inventory keys, source occurrence identities, request/resource resolution outcomes, and source dispositions in the producer's inference packet.
3. Produce the existing closed judgment and proof/closure ledger from those receipts.
4. Implement an independent verifier against every law in `REQUEST_TYPE_DERIVATION_LAW_IDS` (34 laws), returning the existing typed verification ADT and counterexamples without repairing the judgment.
5. Connect the existing decision, authority, and integrity capabilities through the existing assembler using the exact canonical contract instance.
6. Supply the assembled pipeline and existing manifest composition authority at the executable composition root; retain fail-closed behavior if composition is absent.
7. Add behavioral tests for derived, incomplete, conflict, invalid input, duplicate occurrences, and source identity mismatch.

## Verification boundary

`audit:phase2591-cli-manifest-upstream-closure` is a structural audit only. It does not establish typecheck, package build, full tests, or CLI end-to-end success. This phase corrects the law-count discrepancy and codifies the exact unresolved implementation boundary; it does **not** claim that the producer or verifier has been implemented.
