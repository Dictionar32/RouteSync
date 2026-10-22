# Phase 2550 — Canonical Preflight Packet Consumption

## Root cause closed in this phase

Phase 2549 passed the request-resolution ledger into lowering, but the active lowering rebuilt the source-evidence inventory and the solver independently recomputed its resource group identity from the request binding. Resource preflight was used as a CLI gate but its route-to-resource resolution decision was not the identity consumed by grouping.

## Source changes

- CLI `scan` and `sync` pass the complete `RouteManifestRequestResolutionPreflight` packet to projection.
- `RouteManifestProjectionInput` binds the manifest to the exact preflight `sourceEvidence`, request-resolution ledger, and resource-resolution ledger.
- Active lowering reuses the supplied source evidence and no longer rebuilds the same inventory.
- The existing interface-valued `requestTypeDerivationSolver` validates one resource receipt per route occurrence and requires a resolved resource for each `form_request` route.
- Request grouping now consumes `receipt.resolution.resource.canonicalIdentity.semanticKey` from the upstream resource ledger, instead of re-deriving group identity from `requestBinding.identity.resource`.
- The compatibility facade prepares request and resource ledgers from one canonical inventory.

## Boundaries not claimed as solved

The active path still returns `RequestType[]` from the legacy projection solver. This phase does not manufacture `RequestTypeDerivationJudgment` or proof evidence. The production reasoning/verifier/decision/authority composition and the active CLI cutover to a verified judgment remain open. The solver also still has its pre-existing `semantic/relations` dependency; this phase adds no new dependency there and does not claim that dependency has been removed.

## Verification

Run `npm run audit:phase2550-canonical-preflight-packet-consumption`. Full package build, TypeScript typecheck, and CLI end-to-end execution are separate validations and must not be inferred from the structural audit.
