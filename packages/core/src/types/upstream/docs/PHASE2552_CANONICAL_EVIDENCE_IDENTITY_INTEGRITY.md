# RouteSync Phase 2552 — Canonical Evidence Identity Integrity

## Root cause fixed

Phase 2551's source inventory gate matched source domain + occurrence key, then compared only semantic-key strings and serialized locations. It did not recompute the canonical identity and occurrence key from the supplied evidence's own source identity/coordinates. A forged evidence record could therefore retain matching key strings while carrying a different canonical identity payload. JSON serialization also made location equality depend on object property order.

## Implementation

`requestTypeDerivationSolver.ts` now validates each evidence reference through `sameCanonicalSourceEvidence`: it recomputes the canonical route/resource/request identity and source-occurrence key from the evidence's own source data, checks the complete canonical identity payload, and compares source spans and route declaration locations structurally. The gate remains before derivation context creation and grouping. The Phase 2551 audit was updated to assert the new structural validation rather than JSON serialization.

## Verification scope

Run `npm run audit:phase2552-canonical-evidence-identity-integrity`. The audit verifies source-level wiring and TypeScript syntax transpilation for the changed solver. This is not a full package typecheck or CLI end-to-end test.

## Explicit remaining blocker

This phase does not close the upstream RequestType semantic judgment producer/verifier gap. The active lowering still invokes `requestTypeDerivationProjectionPipeline.derive(...)` and receives `RequestType[]`; no fake `derived` judgment is constructed. A production reasoning implementation plus independent verifier for all 32 contract laws must still be implemented and wired before the active CLI can be called fully interface-first. The solver also retains its existing `semantic/relations` dependency.
