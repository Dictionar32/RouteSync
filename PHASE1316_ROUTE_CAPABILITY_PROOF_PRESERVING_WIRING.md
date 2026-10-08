# Phase 1316 — Route capability proof-preserving wiring

Date: 2026-10-08

## Trace finding
`routeCapabilitySemanticAuthority.resolve()` produced a closed `reasoning` contract, but `ResolvedRouteCapability` did not expose it. The boundary therefore discarded the proof and `capabilityBuilder.ts` created another `semanticReasoningContract('evidence_resolution')` with the same strategy. That was a second proof construction point in the route capability path, and it weakened the upstream → wiring → downstream lineage guarantee.

## Change
- Expose the exact upstream `reasoning` contract on `ResolvedRouteCapability`.
- Carry that same contract through `ResolvedRouteBoundaryOptions`.
- Make `buildRouteCapabilityContract` reuse `params.reasoning` instead of calling the contract factory again.
- Keep `derivation.strategy` sourced from the reused proof.
- Add a regression audit and append the invariant to `Engine.Fix.md`.

## Ownership topology
`RouteCapabilitySemanticAuthority → ResolvedRouteCapability → ResolvedRouteBoundaryOptions → RouteCapabilityContract → OperationIdentityCapability → CLI/SDK/React projections`.

The boundary and builder only transport/compose the closed proof. They do not rerun semantic reasoning.

## Validation
Run the targeted Node static audits and `unzip -t` on the resulting archive. Per workspace constraint, do not run `npm run build` or `npm install`; a build result must be obtained in the user's configured local environment.
