> **Historical snapshot notice (Phase 2572):** the CLI path described below is not the current active path. The current scan/sync path injects `RequestTypeDerivationSemanticPipelineInterface` into `createAuthorityBackedRouteManifestProjection` and fails closed if it is absent. See `PHASE2572_CLI_MANIFEST_UPSTREAM_AUTHORITY_TRACE.md` for the current trace. The missing production reasoning producer and complete 32-law verifier remain unresolved.

# Phase 2538 — RequestType Producer Root-Cause Retrace

## Result

The current blocker is **not** missing route declaration spans. That part of the earlier Phase 2422 diagnosis is stale: `RouteProvenanceContract` in `packages/core/src/types/domain/routes.ts` already carries `declarationSpan`, the upstream inventory derives `route-occurrence` keys from `span.file/start/end`, and `RequestTypeRouteEvidenceReference.location` preserves the span.

## Active production path

`CLI scan/sync -> projectRouteSyncManifestForRouteManifest -> routeManifestTypeLowering.project -> requestTypeDerivationProjectionPipeline.derive -> createDerivationContext + aggregateRequestTypeGroups -> RequestType[]`

The active pipeline still imports the legacy `requestTypeDerivationSolver`. That solver returns bare `RequestType[]` and uses `semantic/relations` to resolve requests and merge groups. It does not emit `RequestTypeDerivationJudgment`, source disposition receipts, group contribution receipts, closure ledger, proof, or verified law coverage.

## Existing upstream pieces

- `requestTypeDerivationSourceEvidenceInventory` owns canonical route/resource/request identities and occurrence keys.
- `requestTypeDerivationRequestResolution` owns exact-then-normalized request candidate resolution and preserves missing/ambiguous outcomes as ADT variants.
- `RequestTypeDerivationSemanticReasoningInterface` already defines `infer(input): inference` as the semantic judgment producer boundary.
- `RequestTypeDerivationProofVerificationInterface`, decision, authority, and pipeline assembler contracts already exist.
- The active manifest lowering does not invoke the assembled semantic pipeline; no concrete production reasoning implementation that constructs a judgment and complete proof/ledger is present.

## Root cause

The missing component is a **real semantic producer plus proof verifier, connected to the active manifest lowering**. It is not safe to wrap the legacy solver's `RequestType[]` as `kind: 'derived'`, or mark all law IDs verified, because the legacy solver has not recorded the receipts and closure evidence those claims require. Nor should the request-resolution ADT be connected to the legacy output if missing/ambiguous outcomes are discarded by the `RequestType[]` interface.

## Correct implementation order

1. Implement the existing reasoning interface over the canonical inventory and closed policy; emit route/resource/request dispositions, group contribution receipts, relations, and a judgment-specific closure proof.
2. Implement the verifier against each of the 32 required laws. It must return typed counterexamples and must not repair or reclassify the judgment.
3. Instantiate the existing decision and authority capabilities with the same contract instance and assemble the existing pipeline.
4. Change the active manifest lowering contract to preserve `derived | incomplete | conflict | invalid_input` as explicit outcomes; only project groups into `RequestType[]` after the manifest/CLI policy has explicitly accepted the outcome.
5. Remove the active dependency on `requestTypeDerivationProjectionPipeline` / `requestTypeDerivationSolver` only after regression tests prove semantic parity and non-derived outcomes remain visible.

## Validation boundary

This is a source-trace correction, not a claim that the semantic producer has been implemented. Existing structural audits confirm the active legacy path and the absence of a concrete producer. Full typecheck, package build, and end-to-end CLI tests remain unverified in this snapshot.
