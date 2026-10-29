# Phase 2797 — Fully Typed Runtime Scanner Operations: Manifest Downstream Projections

## Scope
Continue the Phase 2796 trace through the downstream flow, dataflow, graph and request-resolution preflight boundaries. Reuse existing contracts and remove a redundant public forwarding function where the interface-owned operation already exists.

## Runtime trace
```text
CLI scan
  -> routeSyncManifestFlowProjection.project(completeManifest)
  -> routeSyncManifestDataflowProjection.project(manifestFlow)
  -> routeSyncManifestGraphProjection.project(manifestFlow)
  -> graph/dataflow/IR consumers

CLI scan/sync
  -> routeManifestRequestResolutionPreflight.evaluate(completeManifest)
  -> request-type semantic input preparation
  -> explicit request/resource assessment ADTs
  -> projection/lowering only for accepted assessments
```

The flow, dataflow, graph and request preflight already have named operation interfaces. No new upstream interface or generic reasoning primitive was required in this phase.

## Applied change
- Removed the redundant exported `routeSyncManifestGraphSurfaceFromFlow(manifest)` forwarding function.
- Migrated the CLI scan path and end-to-end fixture to `routeSyncManifestGraphProjection.project(manifestFlow)`.
- Exported the already-existing interface-typed frozen `routeSyncManifestGraphProjection` operation from the core barrel.
- Retained `RouteSyncManifestGraphProjectionInterface` as the graph-specific wiring contract.
- Kept `ManifestBuilderJudgment` and its complete/blocked alternatives intact. No blocked result is converted to a success or empty manifest.
- `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Rationale
The old helper was only a forwarding alias to `routeSyncManifestGraphProjection.project`. It introduced a second public entry point without owning separate graph policy. Reusing the existing operation object avoids adding a duplicate interface or changing the semantic projection itself.

## Verification boundary
The Phase 2797 audit checks the operation contract, consumer migration, removal of the forwarding alias, barrel export, existing dataflow/preflight object contracts, ADT preservation, and empty collections module. It is a structural audit, not a full TypeScript typecheck, build, full test suite, or CLI scan/sync end-to-end run.
