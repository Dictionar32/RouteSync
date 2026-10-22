# Phase 2553 — CLI / Upstream Authority Trace and Root-Cause Boundary

## What was corrected

The Phase 2539 audit was stale relative to the current CLI data flow. It expected the CLI to call `projectRouteSyncManifestForRouteManifest(completeManifest)` and expected projection to call `routeManifestTypeLowering.project(manifest)`. The actual implementation forwards the preflight packet:

`scan/sync -> projectRouteSyncManifestForRouteManifest(completeManifest, requestResolutionPreflight) -> routeManifestProjection.project(Object.freeze({ manifest, ...preflight })) -> routeManifestTypeLowering.project(input)`.

The audit now checks that real path and labels the legacy relation-backed solver as an open root cause rather than mistaking the alias for semantic authority.

## Source-traced root cause (not fixed by this phase)

The active lowering still calls `requestTypeDerivationProjectionPipeline.derive(...)`. The exported pipeline is only an alias to `requestTypeDerivationSolver`, whose public result is a bare `RequestType[]` and whose implementation imports `semantic/relations/relationalSequence`.

The upstream type contract already declares:

- canonical source-evidence inventory and domain-specific identity / occurrence keys;
- closed `derived | incomplete | conflict | invalid_input` judgment variants;
- `RequestTypeDerivationSemanticReasoningInterface`;
- proof-verification, decision, authority and pipeline-assembly interfaces;
- a 32-law coverage contract.

But the active path has no concrete production reasoning implementation that constructs the full judgment, per-source dispositions, group-contribution receipts, closure ledger and independently verified proof. The pipeline assembler composes injected capabilities; it is not itself the missing semantic producer.

## Why the solver was not wrapped as a judgment

Wrapping its `RequestType[]` as `derived`, or claiming all 32 laws verified, would fabricate evidence: the solver does not emit the required source receipts, contribution transitions, closure proof, typed counterexamples or independent verification result. That would hide the source defect rather than fix it.

## Required implementation sequence

1. Implement the existing semantic reasoning interface in the upstream semantic owner, consuming canonical inventory and closed resolution ADTs.
2. Produce complete source-disposition and contribution-receipt ledgers plus a judgment-specific closure proof.
3. Implement an independent verifier for every required law, returning typed counterexamples without repairing or reclassifying the judgment.
4. Assemble the existing reasoning/verifier/decision/authority capabilities under one canonical contract instance.
5. Change manifest lowering and CLI policy to preserve all judgment variants; project `RequestType[]` only for an accepted `derived` judgment.
6. Remove the relation-backed legacy path only after semantic parity and regression tests prove missing/ambiguous/conflict cases remain explicit.

## Verification performed

The following source audits were executed successfully in this snapshot:

- Phase 2552 canonical evidence identity integrity: 11/11
- Phase 2539 CLI/upstream authority trace: 12/12
- Phase 2535 upstream request-resolution operation: 14/14
- Phase 2542 CLI request-resolution closure: 12/12
- Phase 2543 resolution preflight before lowering: 12/12
- Phase 2544 source-occurrence/resolution alignment: 6/6

Total: 67/67 structural assertions passed.

Full TypeScript typecheck, package build, Vitest and end-to-end CLI verification were not run because dependencies are absent from this source snapshot. This phase corrects the stale audit and records the exact implementation blocker; it does **not** claim the semantic producer/verifier root cause is fixed.
