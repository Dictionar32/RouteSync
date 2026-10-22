# Phase 2557 — Production Composition Assembly Boundary

## Goal

Move the production composition boundary from a no-argument throwing placeholder toward the existing upstream interface model, without fabricating semantic evidence or reintroducing the legacy `RequestType[]` solver.

## Source change

`assembleRequestTypeDerivationProductionPipeline(composition)` now accepts the existing `RequestTypeDerivationSemanticPipelineCompositionInterface` and delegates to `createRequestTypeDerivationSemanticPipelineAssembler().assemble(composition)`. The result is the existing typed `assembled | rejected` ADT. The canonical assembler verifies that reasoning, verifier, decision, and authority share the same contract instance before exposing the pipeline.

The active path remains:

`CLI scan/sync → canonical preflight packet (manifest + exact input + evidence inventory + request/resource ledgers + closed assessments) → require pipeline → projectRouteSyncManifestForRouteManifest(preflight, pipeline) → authority-backed projection → authority-backed lowering consumes the same preflight.input/ledgers → operation preparation → pipeline.derive(input) → assessment integrity validation → closed judgment outcome → projection consumer`

The preflight packet is now passed unchanged through projection and lowering. Lowering no longer rebuilds source evidence or the request-resolution ledger, so the identity/occurrence evidence checked before the gate is the evidence consumed by semantic derivation. The projection API accepts the packet instead of a separate manifest argument, preventing accidental manifest/preflight mismatches at this boundary.

The CLI's zero-argument `requireRequestTypeDerivationSemanticPipeline()` still fails closed because no concrete production reasoning/verifier/decision/authority composition exists in this repository snapshot. This is intentional: no legacy solver result is promoted into a proof-backed judgment.

## Root cause still open

Concrete implementations of the four semantic capabilities are missing. In particular, the complete verifier for all 32 law IDs and the source-bound reasoning producer must be implemented before CLI can run end-to-end. The assembly factory is a real wiring seam, not a claim that the production capabilities now exist.

## Validation

Run `node scripts/audits/audit-phase2557-production-composition-assembly.cjs`. Phase 2557 currently checks both composition assembly and exact preflight-packet forwarding. This is a structural audit only; it does not replace TypeScript typecheck, package build, or CLI integration tests.
