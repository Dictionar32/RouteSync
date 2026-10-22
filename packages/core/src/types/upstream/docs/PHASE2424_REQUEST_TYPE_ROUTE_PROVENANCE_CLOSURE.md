# Phase 2424 — RequestType Route Source Provenance Closure

## Repair applied

The canonical `RouteDeclarationEvidence` contract now requires a `SourceSpan`; it no longer permits the route declaration span to be represented as `absent`. The existing AST-to-evidence producer creates the span from the declaration's original start/end offsets. The active Laravel route scanner reuses `evidence.span` when composing `RouteProducerInput`, instead of independently reconstructing the same coordinates.

The same declaration span now travels through the existing route-boundary options and provenance builder into `RouteSemanticFlow.provenance.declarationSpan`. The existing `RequestTypeRouteOccurrenceLocation` carries that span alongside its file and line coordinates, so repeated declarations on the same line have the source-coordinate evidence needed to distinguish occurrences.

No parallel evidence interface or new semantic authority was introduced.

## Verification

Run:

```sh
node scripts/audits/audit-phase2424-request-type-route-provenance-closure.cjs
```

The static audit checks each handoff from AST offsets through the existing evidence, boundary, flow, and RequestType location contracts.

## Remaining blocker

This repair closes the route source-location data-loss gap only. The active `routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`; the authority-backed lowering remains an injected alternative rather than the active default. The repository snapshot also does not contain concrete production implementations for all RequestType derivation capabilities. Therefore this phase does **not** claim full interface-first RequestType derivation, CLI closure, or regression validation.

A full TypeScript check and package tests were not established: dependencies are absent in this snapshot, and the available global TypeScript 5.8.3 cannot parse the repository's TypeScript 7 target/configuration and reports pre-existing errors in unrelated files.
