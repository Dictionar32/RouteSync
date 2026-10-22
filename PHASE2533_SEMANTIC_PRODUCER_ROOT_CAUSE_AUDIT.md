# RouteSync Phase 2533 — Semantic Producer Root-Cause Audit

## Scope

Audit the Phase 2532 source snapshot for upstream `export const: ExistingInterface` operation ownership, AST/ADT semantic judgments, source evidence inventory, canonical identity, and active manifest/CLI wiring.

## Root-cause findings

### Fixed in earlier phases and re-verified here

- Canonical route/resource/request semantic identities are owned by the upstream inventory interface and represented with closed identity ADTs.
- Route endpoint identity includes method, declared path, route name, resource, domain, and group; source-occurrence identity remains a separate concept based on declaration/source coordinates.
- Inventory and source-occurrence verification call the same canonical upstream identity operations rather than rebuilding keys independently.
- The inventory value is explicitly typed by the existing interface and does not need another factory/helper abstraction.
- The identity path inspected here does not import `semantic/foundation` or `semantic/relations`.

### Still open — actual semantic producer gap

The active CLI path remains:

`scan/sync CLI → projectRouteSyncManifestForRouteManifest → routeManifestProjection → routeManifestTypeLowering → requestTypeDerivationProjectionPipeline → requestTypeDerivationSolver.aggregateRequestTypeGroups`

The active lowering still calls `requestTypeDerivationProjectionPipeline.derive(...)`, whose solver uses the legacy relational/group-solving path and returns `RequestType[]`. Therefore the existing closed `RequestTypeDerivationJudgment`/assessment contracts are not the active source of request types in the default CLI path.

The authority-backed path exists as an alternative composition, but it requires a supplied `RequestTypeDerivationSemanticPipelineInterface`. The assembler composes injected reasoning, verifier, decision, and authority capabilities; it does not implement source reasoning or full proof verification. The source snapshot contains no concrete production reasoning implementation that closes the declared semantic laws. Wiring the authority-backed route into the CLI before supplying a real producer would either leave the app unconstructible or tempt a fake/legacy adapter, neither of which is acceptable.

## Correct repair boundary

1. Keep the existing upstream identity and inventory contracts; do not duplicate them.
2. Implement the actual semantic reasoning operation against the existing `RequestTypeDerivationSemanticReasoningInterface`, producing a judgment/inference packet bound to the exact inventory input.
3. Implement a complete verifier for the existing declared law set, including source evidence correlation, occurrence identity, semantic identity, completeness/conflict/invalid-input outcomes, and proof receipts. The source-occurrence guard alone is not the full verifier.
4. Assemble reasoning + complete verifier + decision + authority using the same canonical contract instance.
5. Wire that concrete pipeline through the existing authority-backed composition into the active manifest/CLI entry point. Preserve blocked/incomplete/conflict outcomes as closed data; never fall back to `RequestType[]` from the legacy solver.
6. Only then retire the legacy solver from this active path and prove CLI scan/sync behavior with regression tests.

## Audit script correction in this phase

`audit-phase2431-active-request-type-authority-closure.cjs` had three stale source-pattern checks: it expected the old integrated composition call, old runtime-executor factory, and direct `composition.verifier.verify` invocation. The source now uses `createRouteManifestProjectionComposition(pipeline)`, `createRequestTypeDerivationOperationPreparation(...)`, and a guarded local `verifier.verify(inference)`. The audit patterns were updated to reflect the actual source without weakening the assertions.

## Verification evidence

- Phase 2530 route evidence/semantic identity audit: 24/24 passed.
- Phase 2531 route endpoint identity audit: 11/11 passed.
- Phase 2532 source-occurrence identity operation audit: 13/13 passed.
- Phase 2431 active request-type authority closure audit (corrected stale patterns): 10/10 passed.
- Full typecheck, package build, and test suite were not run in this environment; this phase does not claim they pass.

## Scope of implementation

This phase corrects the stale audit and documents the actual remaining source-level blocker. It does **not** claim that the semantic reasoning producer, full proof verifier, or active CLI authority wiring has been implemented. Those require a real domain-semantic implementation, not a placeholder that relabels legacy solver output as a verified judgment.
