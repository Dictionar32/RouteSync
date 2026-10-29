# Phase 2843 — CLI Manifest Runtime Operations Audit

## Runtime trace

`CLI scan/sync command -> RouteSyncCliUpstreamCompositionInterface -> manifestScanOperation.scan(input) -> routeSyncCliManifestScanOperationFactory.create(manifestComposition) -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input) -> source discovery / identity and inventory judgments -> LaravelSourceAstPipelineInterface -> ManifestBuilderInterface -> ManifestBuilderJudgment (complete | blocked) -> route manifest projection via RequestTypeDerivationSemanticPipelineInterface`.

The drift-audit branch consumes the manifest ADT using `continueForDriftAudit` handlers. It does not need a second generic dispatcher. The source AST and manifest builder judgments retain typed continuations on terminal arms. Semantic dataflow judgments expose domain operations (`containsFact`, `reaches`, `pathsBetween`) attached by the producing authority rather than a primitive `reasoning` label.

## Existing contracts reused

- `RouteSyncCliManifestScanOperationInterface` and `RouteSyncCliManifestScanOperationFactoryInterface` in the CLI package.
- `RouteSyncCliUpstreamCompositionInterface` as the command-facing composition boundary.
- `ControllerInvocationManifestCompositionAuthorityInterface` as the producer of the manifest judgment.
- `LaravelSourceAstPipelineInterface` and `ManifestBuilderJudgment` for source-AST and manifest terminal states.
- `SemanticDataflowJudgmentOperationsInterface` and `semanticDataflowReasoningAuthority` for semantic query operations.

No parallel manifest contract is introduced. `packages/core/src/types/upstream/collections.ts` remains empty.

## Interface-first usage example

```ts
const operation: RouteSyncCliManifestScanOperationInterface =
  routeSyncCliManifestScanOperationFactory.create(manifestComposition);
const manifest = await operation.scan(input);
```

Terminal ADTs should be consumed through their owned domain operation, for example `judgment.continueWith({ onComplete, onBlocked })`, or `freshManifest.continueForDriftAudit({ complete, manifestBlocked, ... })`, not by recreating outcome interpretation in each consumer.

## Audit and limits

Run `npm run audit:phase2843-cli-manifest-runtime-operations`. The audit checks source-level contract presence and the actual scan/sync/drift call paths. It is a structural audit, not a TypeScript build, test run, or CLI E2E proof. Do not claim full runtime/type correctness until the repository's compiler configuration, dependencies, and missing imported source modules are repaired and focused tests pass.

## Follow-up recommendations

1. Continue by migrating exported function-shaped operations only when their actual runtime consumers can move in the same change; do not mass-convert every helper solely based on syntax.
2. Audit exports and call sites together, especially `packages/core/src/types/upstream` and its public barrel.
3. Remove primitive reasoning tags only where the typed contract already carries verifiable evidence or domain operations; preserve meaningful `reasoningContract` evidence that admission validates.
4. Keep complete/blocked and accepted/rejected outcomes distinct; never normalize blocked producer results into an empty successful manifest.
