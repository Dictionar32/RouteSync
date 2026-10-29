# Phase2936 — Fully Explicit Typed Runtime Scanner Operations

## Scope

This phase continues the manifest-path audit from Phase2935. It removes the generic result-handler abstraction from `ManifestBuilderJudgment` and replaces it with a concrete domain operation that the judgment itself owns.

## Trace

`CLI scan/sync → RouteSyncCliManifestScanOperationInterface → ControllerInvocationManifestCompositionAuthorityInterface → ManifestBuilderOperationPreparationInterface.prepare → ManifestBuilderInterface.build → LaravelSourceAstPipelineInterface.execute → source-AST judgment → CompleteLaravelSourceModelBuilderInterface.build → SemanticDataflowManifestSurfaceInterface → ManifestBuilderJudgment → manifest flow projection → CLI flow judgment`.

## Changes

- `ManifestBuilderJudgmentHandlers<Result>` was removed from the manifest builder contract.
- The generic `continueWith<Result>(handlers)` operation was replaced by `continueToFlow(projection: ManifestBuilderFlowProjectionInterface)`.
- A complete manifest judgment projects its canonical manifest through the provided projection and returns `ManifestBuilderFlowCompleteJudgment`.
- A blocked manifest judgment returns itself, retaining the original source-AST or source-model blocker. It cannot become a successful flow judgment.
- The existing downstream `RouteSyncManifestFlowProjectionInterface` remains the CLI/wiring boundary; it structurally supplies the narrower upstream projection capability instead of duplicating flow-projection logic.
- The manifest builder contract version was incremented from 8 to 9.
- The upstream barrel exports the new public domain contract types.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Interface-first usage

```ts
const flowJudgment = manifestJudgment.continueToFlow(routeSyncManifestFlowProjection);
```

The consumer no longer supplies a generic handler object or chooses complete versus blocked. The judgment owns the domain follow-up operation. The blocked arm preserves the exact existing blocker.

## Verification

Run `npm run audit:phase2936-fully-explicit-runtime-scanner-operations` from the repository root for static structural checks. This is not a substitute for TypeScript typecheck, unit tests, build, or end-to-end CLI execution. The archive's dependencies are not installed. A typecheck attempt with global TypeScript 5.8.3 failed before project checking because Node/Vitest type definitions are missing and that compiler does not accept the repository's `ES2025` target. No typecheck, unit-test, build, or end-to-end pass is claimed.

## Remaining trace gaps

- `LaravelSourceAstProjectionJudgment` still uses its own continuation contract; its generic handler should only be redesigned after mapping all consumers and deciding which domain operations are required.
- Source-model construction still inspects its own blocked result in `upstreamManifestBuilder.ts`. That decision is inside the manifest-building authority, not the downstream scanner; a richer source-model judgment operation may be a later targeted change if it can reuse an existing source-model contract.
- Route-source file reads still use `fs.promises.readFile` directly. Operational filesystem failures are not yet represented by the route scanner as a preserved read-blocker ADT at this boundary.
- The runtime export audit is scoped to the listed CLI/manifest/scanner files; it does not claim repository-wide elimination of exported function declarations or inferred `export const` arrow functions.
