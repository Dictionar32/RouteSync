# Phase 2592 — CLI → Manifest → Upstream Production Path

## Purpose

This phase corrects a false-green risk in the prior structural audit. A test that confirms the absence of a producer is useful for diagnosis, but it must not report the production path as complete. The new audit explicitly marks missing production reasoning, the complete independent verifier, and executable composition as blockers.

## Confirmed upstream operations

- `requestTypeDerivationSourceEvidenceInventory.ts` exports canonical route/resource/request identity and occurrence-key operations, plus the three-domain source inventory.
- `requestTypeDerivationRequestResolution.ts` exports exact-then-normalized request resolution with explicit `missing` and `ambiguous_*` ADT cases.
- `requestTypeDerivationResourceResolution.ts` exports canonical resource resolution with explicit `missing` and `ambiguous` ADT cases.
- `requestTypeDerivationSourceOccurrenceVerification.ts` checks source occurrence laws and delegates all remaining proof laws to a supplied verifier. It explicitly does not claim to be the complete verifier.
- `requestTypeDerivationSemanticPipelineAssembler.ts` connects reasoning, verification, decision, authority and integrity after checking exact contract identity.
- `upstreamCompositionFactory.ts` connects a supplied manifest authority and assembled semantic pipeline.

## Production blockers

1. No concrete production `RequestTypeDerivationSemanticReasoningInterface` implementation was found that constructs the complete source-bound judgment/proof packet.
2. No single independent production verifier was found that establishes every one of the 34 canonical laws in `REQUEST_TYPE_DERIVATION_LAW_IDS`.
3. `packages/cli/src/index.ts` still creates the executable program with `createProgram()` and supplies no production composition.

## Architecture decision

Do not wrap legacy `RequestType[]` in a `derived` judgment. Do not mark laws verified by enumerating IDs. Do not add duplicate interfaces or move semantic decisions into `scan.ts`/`sync.ts`. Implement producer and verifier against the existing upstream contracts, then connect them through the existing assembler and executable composition root.

## Verification

Run `node scripts/audits/audit-phase2592-cli-manifest-upstream-production-path.cjs`. It intentionally exits non-zero while production blockers remain. This is a structural blocker audit, not a TypeScript build or CLI end-to-end test.
