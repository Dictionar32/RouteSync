# RouteSync Phase 2534 — Canonical RequestType Derivation Contract

## Source baseline

Based on the Phase 2533 source snapshot available in this conversation. This is a source patch against that archive, not a claim that the user's local working tree was modified.

## Root cause addressed in this phase

The upstream module declared `RequestTypeDerivationContract`, its semantic policy, and 32 law identifiers, but did not export one canonical runtime contract value. Consequently, a future semantic composition had no single contract value in this module to share by identity across reasoning, verification, decision, and authority.

## Implemented

- Added `requestTypeDerivationContract: RequestTypeDerivationContract` in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`.
- The value defines the existing policy domains: request resolution, resource identity, group identity, action contribution, response contribution, group contribution, outcome coherence, and closure.
- All 32 `REQUEST_TYPE_DERIVATION_LAW_IDS` are explicitly marked `required`.
- The contract, policy sections, and law map are frozen.
- Added `audit:phase2534-canonical-request-type-contract` and a source audit that checks the canonical value, exact law coverage, immutability, syntax transpilation, and the still-open active-path blocker.
- No duplicate interface was introduced; no `semantic/foundation` or `semantic/relations` import was added to the upstream contract module.

## Verification

`node scripts/audits/audit-phase2534-canonical-request-type-contract.cjs`: **10/10 checks passed**. This includes loading the transpiled contract value and checking that its 32 law keys match the exported law identifier union.

A targeted `tsc --noEmit --strict ... requestTypeDerivationInterface.ts` run reached transitive source files but failed on pre-existing workspace diagnostics in unrelated domain/upstream modules (including HTTP method visitor, resource model method resolver, completeness, and controller policy types). The compiler output did not report an error in `requestTypeDerivationInterface.ts`; this is not a clean project typecheck.

## Remaining root cause — not claimed fixed

The active path still calls `requestTypeDerivationProjectionPipeline.derive(...)`, which calls `aggregateRequestTypeGroups(...)` and returns bare `RequestType[]` using the legacy relational solver. There is still no concrete production implementation of the complete `RequestTypeDerivationSemanticReasoningInterface` and full 32-law proof verifier wired into the active CLI path.

This phase therefore closes the missing canonical contract-value ownership only. It does not claim the semantic producer, verifier, or CLI cutover is complete. Do not wrap legacy solver output in a fabricated `derived` judgment. The next implementation must produce source-bound route/resource/request receipts, group contribution transitions, closure and conflict/unresolved ledgers, then verify the same judgment before projection.
