# Phase 2541 — Active Request Resolution Ledger

## Root cause addressed

Phase 2540 connected the existing request-resolution ADT to the legacy solver, but `missing` and `ambiguous_*` outcomes still collapsed to no descriptor. The active manifest projection also exposed only `RequestType[]` plus source evidence, so callers could not inspect each route's request-resolution result at that boundary.

## Implementation

- Corrected the route-binding discriminator at the semantic contract/consumer boundary: the actual `RouteRequestBinding` variant is `form_request`, not `request`. The request descriptor receives `requestBinding.identity` (`RequestIdentity`), not the entire route-binding wrapper.
- Added the upstream-owned `RequestTypeRouteRequestResolutionReceipt` data contract and `RequestTypeRouteRequestResolutionInventoryInterface`.
- Added the compiler-owned `requestTypeDerivationRequestResolutionInventory` operation. It records the existing exact-first/normalized-unique ADT for explicit request bindings and records `not_required` for other binding kinds. It does not construct `RequestTypeDerivationJudgment` or claim proof verification.
- Wired the ledger into both legacy and authority-backed type lowering, then forwarded it through both projection paths, including blocked/non-projectable authority outcomes.
- Exported the operation from the core entry point.
- Added `audit-phase2541-active-request-resolution-ledger.cjs` to verify contract ownership, active wiring, preservation on both success/failure paths, and the absence of `semantic/foundation` / `semantic/relations` dependencies in the new operation.

## Active path after this phase

`CLI scan/sync → manifest projection → routeManifestTypeLowering → source evidence inventory → request-resolution ledger + legacy RequestType projection → RouteManifest projection`

The ledger preserves the resolution ADT at the projection boundary. It does **not** by itself stop the legacy `RequestType[]` projection from omitting unresolved routes, and it is not a substitute for the canonical semantic judgment.

## Still open

1. Implement a concrete producer for source dispositions, group receipts, proof ledger, and closed `RequestTypeDerivationJudgment`.
2. Implement independent verification of all 32 required laws; do not mark coverage verified merely because law IDs are listed.
3. Compose the existing reasoning/verifier/decision/authority interfaces with that concrete producer.
4. Cut the default CLI path over to authority-backed projection only after verified regression coverage; remove the legacy solver path only when parity and error behavior are demonstrated.
5. Surface the ledger through the final CLI diagnostic/result contract if CLI users need to act on missing or ambiguous bindings; current change preserves it in projection/composition results, not in the serialized RouteManifest shape.

## Verification

- `node scripts/audits/audit-phase2541-active-request-resolution-ledger.cjs`: 15/15 assertions passed.
- TypeScript transpile/syntax check: all changed `.ts` files passed syntax parsing.
- Full `tsc --noEmit` remains blocked by pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts` (lines 47 and 221) and the installed global TypeScript version rejecting repository target/lib `es2025`. Full typecheck, package build, and runtime regression tests are not claimed as passed.
