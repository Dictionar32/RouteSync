> **Historical snapshot notice (Phase 2572):** the CLI path described below is not the current active path. The current scan/sync path injects `RequestTypeDerivationSemanticPipelineInterface` into `createAuthorityBackedRouteManifestProjection` and fails closed if it is absent. See `PHASE2572_CLI_MANIFEST_UPSTREAM_AUTHORITY_TRACE.md` for the current trace. The missing production reasoning producer and complete 32-law verifier remain unresolved.

# Phase 2539 — CLI Upstream Authority Trace

## Trace result

The active production path is:

`packages/cli/src/commands/scan.ts` / `sync.ts` → `projectRouteSyncManifestForRouteManifest(completeManifest)` → `routeManifestProjection.project` → `routeManifestTypeLowering.project` → `requestTypeDerivationProjectionPipeline.derive` → `createDerivationContext` / `aggregateRequestTypeGroups` → `RequestType[]`.

The public `export` is present and is not the root blocker. The canonical upstream interfaces also exist: `RequestTypeDerivationSemanticReasoningInterface`, `RequestTypeDerivationProofVerificationInterface`, closed `RequestTypeDerivationJudgment`, source evidence inventory, identity keys, and the pipeline assembler.

## Root cause

The active CLI projection does not consume the assembled semantic authority pipeline. It still consumes a legacy projection contract that returns `readonly RequestType[]`. The solver still uses `semantic/relations` and does not emit source-disposition receipts, contribution receipts, a complete closure ledger, or a judgment proof. Missing/ambiguous request resolution can therefore collapse into absence from the projected array rather than survive as a first-class semantic outcome.

The assembler and authority do not fill this gap: they compose injected capabilities. The authority's kernel must provide a real judgment producer and proof verifier. No production implementation completing all 32 law obligations was found in this source snapshot.

## Safe implementation boundary

Do not wire the request-resolution ADT into the legacy `RequestType[]` pipeline while discarding its `missing` / `ambiguous_*` outcomes. Do not wrap the legacy solver output in `kind: 'derived'` or mark laws verified without corresponding receipts and proof. Either change would create false semantic authority.

The actual code fix must implement the existing reasoning operation and verifier against the existing ADTs, instantiate the existing decision/authority/assembler with one canonical contract, then evolve the manifest lowering result so `derived | incomplete | conflict | invalid_input` remains explicit through CLI policy. Only after that should the active CLI composition root switch away from the legacy solver.

## Validation boundary

`audit:phase2539-cli-upstream-authority-trace` is a structural source audit, not a typecheck, package build, or end-to-end CLI test. Full typecheck/build could not be run from this source snapshot because `node_modules` is absent.
