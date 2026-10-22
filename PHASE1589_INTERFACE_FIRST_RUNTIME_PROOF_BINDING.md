# Phase 1589 — Interface-First Runtime Proof Binding

Date: 2026-10-11

## Trace

`types/upstream/requestTypeDerivationInterface.ts` defines a closed assessment whose decision proof carries the input, judgment, verification, and coverage. `requestTypeDerivationRuntimeExecutor.ts` previously trusted that the injected pipeline's assessment was bound to the current input and that the runtime contract still declared every law. That left a contract-integrity gap at the executor boundary even though the static interface was strong.

## Change

- The runtime executor validates the contract's identity, authority, closure, reasoning model, and complete required-law coverage before projecting.
- The executor binds the proof's `premises.input` to the submitted evidence using structural evidence equality. This check validates provenance binding; it does not classify request meaning or derive a replacement judgment.
- Contract rejection and proof-input mismatch are explicit typed results. They are not converted into an empty projection or a fabricated semantic judgment.
- Authority-backed lowering preserves both outcomes as non-projectable. It does not fall back to the legacy solver.
- Added `scripts/audits/audit-phase1589-runtime-proof-binding.cjs`.

## Architectural boundary

Semantic classification remains the responsibility of the upstream reasoning producer. The executor's conditionals only validate the declared contract, bind proof to evidence, and dispatch the already-closed assessment ADT. These are execution/contract-integrity checks, not request-type semantic reasoning.

## Remaining blocker

The default `routeManifestTypeLowering.ts` and `routeManifestProjection.ts` still use the legacy `RequestType[]` projection pipeline because the repository does not yet provide a production proof-producing semantic pipeline at the default composition root. Phase 1589 does not claim end-to-end cutover. The next phase must implement and verify that producer, inject it at composition, then migrate the default scanner route and compatibility consumers without inventing proof data.

## Validation

- Structural audit: run `node scripts/audits/audit-phase1589-runtime-proof-binding.cjs`.
- Full build remains unverified until repository dependencies and the configured build executable are available.
