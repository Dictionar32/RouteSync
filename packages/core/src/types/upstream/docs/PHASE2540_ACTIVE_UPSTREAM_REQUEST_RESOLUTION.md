# Phase 2540 — Active Upstream Request Resolution

## Change made

The active RequestType projection path now obtains request evidence from the canonical upstream source-evidence inventory and resolves each typed route request binding through the existing `requestTypeDerivationRequestResolution` operation. The projection pipeline passes route evidence into the derivation context so the inventory is built from the same route/resource/request input set.

For a successful exact or normalized resolution, the legacy descriptor adapter re-associates the selected evidence with its AST using the evidence source coordinates (file/start/end). Missing and ambiguous resolutions do not select the first candidate. No `semantic/foundation` dependency was added.

## Verified path

```text
CLI scan/sync
  → projectRouteSyncManifestForRouteManifest
  → routeManifestProjection.project
  → routeManifestTypeLowering.project
  → requestTypeDerivationProjectionPipeline.derive
  → createDerivationContext(routes, resources, requests, interner)
  → requestTypeDerivationSourceEvidenceInventory.inventory(...)
  → requestTypeDerivationRequestResolution.resolve(...)
  → legacy RequestType descriptor aggregation
```

## Root cause not yet closed

This is a real wiring change, not completion of the full upstream semantic authority. The active projection still aggregates `RequestType[]` in `requestTypeDerivationSolver.ts`; unresolved/ambiguous outcomes still collapse to no descriptor at that legacy boundary. The closed `RequestTypeDerivationJudgment` producer, full proof verifier for all 32 laws, decision/authority composition, and authority-backed CLI cutover remain unimplemented. The existing authority adapter/assembler only compose injected capabilities and must not be represented as a concrete producer.

## Validation

- `audit-phase2535-upstream-request-resolution-operation.cjs`: 14/14 passed.
- `audit-phase2537-request-resolution-cardinality-adt.cjs`: 11/11 passed.
- `audit-phase2530-route-evidence-semantic-identity.cjs`: 24/24 passed.
- `audit-phase2531-route-endpoint-identity.cjs`: 11/11 passed.
- `audit-phase2532-source-occurrence-identity-operation.cjs`: 13/13 passed.
- `audit-phase2431-active-request-type-authority-closure.cjs`: 10/10 passed (records the remaining legacy path).
- `audit-phase2540-active-upstream-request-resolution.cjs`: 9/9 passed.
- TypeScript typecheck and package build were not run: workspace `node_modules` is absent.
