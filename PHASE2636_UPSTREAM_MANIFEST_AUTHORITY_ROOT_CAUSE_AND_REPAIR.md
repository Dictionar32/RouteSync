# RouteSync Phase 2636 — Upstream Manifest Authority Root Cause and Repair

Date: 2026-10-21

## Work performed

- Re-traced the active CLI → manifest preflight → upstream RequestType semantic pipeline → projection/lowering path.
- Added `scripts/audits/audit-phase2636-upstream-manifest-authority-trace.cjs` and `npm run audit:phase2636-upstream-manifest-authority-trace`.
- Repaired two stale audit assertions so they inspect the current CLI composition and projection API rather than retired entrypoints:
  - Phase 2591 now checks the actual standalone loader ADT and non-zero rejection path.
  - Phase 2614 now checks `createRouteManifestProjectionComposition(...).project(preflight, ...)`, which is the current active call.
- Reused existing `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` contracts. No parallel/V2 interface was introduced.
- Preserved the no-fallback boundary and did not add dependencies on `semantic/foundation` or `semantic/relation`.

## Actual path traced

1. `packages/cli/src/standaloneCompositionLoader.ts` loads a host-owned `requestTypeDerivationSemanticComposition` and validates its capability shape and canonical contract identity.
2. `packages/cli/src/index.ts:createProgramFromSemanticComposition` binds the existing manifest composition and sends the supplied semantic capability bundle to the CLI upstream factory.
3. `packages/cli/src/upstreamCompositionFactory.ts:composeRouteSyncCliUpstream` calls the canonical production assembler and preserves typed assembly rejection.
4. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts` wires reasoning → verifier → coverage → decision → authority integrity.
5. `packages/cli/src/commands/scan.ts` and `sync.ts` produce one manifest-bound preflight packet and pass it to `createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(...)`.
6. `packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts` lowers the manifest only for the closed `projected` result. `not_projectable` remains a closed blocked result.

## Root cause remains upstream

The code declares 34 canonical RequestType derivation laws, but a law inventory is not proof. The repository contains the reasoning/verifier/decision/authority interfaces and an assembler, but `requestTypeDerivationProductionComposition.ts` explicitly says it does not ship concrete production reasoning and a complete independent verifier. `requestTypeDerivationSourceOccurrenceVerification.ts` guards occurrence-related laws and delegates the remaining obligations to the injected verifier. The inventory operation creates canonical identities and evidence keys; it is not the semantic judgment producer.

Therefore the remaining blocker is a missing production semantic kernel, not a missing CLI export or a projection wiring issue. Implementing a nominal `export const name: Interface` stub, marking all 34 laws verified, adapting the legacy `RequestType[]` solver into a proof, or treating inventory/preflight as judgment would hide the problem and fabricate authority. This phase does not do that.

## Required next implementation at the proper owner

Implement under `packages/core/src/compiler/semantic/request-type-derivation/`, using the already-existing upstream contracts:

1. A source-bound reasoning operation implementing `RequestTypeDerivationSemanticReasoningInterface`, preserving exact input identity, canonical source inventory, request/resource resolution outcomes, source disposition ledger, contribution receipts/transitions, closure, and typed conflict/incompleteness judgments.
2. An independent verifier implementing `RequestTypeDerivationProofVerificationInterface` and checking each required witness against the original input and inference for all 34 canonical laws. The source-occurrence guard remains a decorator, not the verifier itself.
3. Connect real decision, authority, and integrity implementations through `RequestTypeDerivationSemanticPipelineCompositionInterface` and the existing assembler.
4. Supply that complete composition from the host module loaded by `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`. Until the kernel exists, the CLI must continue to fail closed.
5. Add behavioral fixtures for exact and normalized unique matches, missing/ambiguous request identities, duplicate source occurrences, conflicting group contributions, incomplete closure, forged proof witnesses, and source-location mismatch.

## Laravel source constraints

Do not derive generic CRUD semantics from a resource name alone. Laravel allows `only`/`except`, API resources, nested and shallow resources, custom route names and parameter names, singleton resources, and explicit controller methods. Route/action identity must be grounded in parsed source evidence and its configured framework semantics.

Official references:
- Laravel Routing: https://laravel.com/framework/docs/12.x/routing
- Laravel Controllers: https://laravel.com/framework/docs/12.x/controllers

## Verification

Executed successfully in the extracted workspace:

- `npm run audit:phase2636-upstream-manifest-authority-trace` — 11/11 assertions passed.
- `npm run audit:phase2591-cli-manifest-upstream-closure` — 8/8 assertions passed after correcting its stale assertion.
- `npm run audit:phase2614-manifest-upstream-contract-alignment` — 7/7 assertions passed after correcting its stale projection call assertion.
- `npm run audit:phase2632-request-type-production-capability-root-cause` — 11/11 assertions passed.
- `npm run audit:phase2633-cli-preflight-packet-identity` — 10/10 assertions passed.
- `npm run audit:phase2634-cli-semantic-authority-single-gate` — 10/10 assertions passed.
- `npm run audit:phase2579-authority-integrity-closed-adt` — 13/13 assertions passed.

The audit `audit:phase2534-canonical-request-type-contract` could not run because it reads a retired path, `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts`. It was not silently counted as a pass. Full TypeScript typecheck, Vitest, package build, and Laravel end-to-end fixtures were not run; this archive has no installed `node_modules`.

## Status

- CLI → manifest → upstream composition wiring: traced; structural checks pass.
- Stale audit assertions: repaired.
- Production semantic reasoning + complete independent verifier: **still missing**.
- No claim of full semantic closure or successful production build is made.
