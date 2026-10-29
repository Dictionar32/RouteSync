# Phase2937 — Fully Explicit Typed Runtime Scanner Operations

## Scope

This phase closes one remaining decision in the upstream CLI manifest path: `upstreamManifestBuilder.ts` previously inspected `CompleteSourceModelBuildResult.kind` and branched between complete and blocked outcomes. The existing source-model contract in `highLevelSourceModel.ts` is the semantic owner, so it is evolved rather than creating a parallel source-model result abstraction.

## Change

`CompleteSourceModelBuildCompleteResult` and `CompleteSourceModelBuildBlockedResult` now both expose `continueToManifestBuild`, backed by the named, fixed-domain `CompleteSourceModelManifestBuildContinuationInterface`. The continuation has only the two source-model domain arms (`onComplete` and `onBlocked`) and does not expose a generic `Result` parameter.

`upstreamManifestBuilder.ts` now delegates through `completeLaravelSourceModelBuildResult.continueToManifestBuild(...)`; it no longer inspects the source-model result's `kind`. The blocked arm still produces `ManifestBuilderSourceModelBlocker` with the exact blocked source-model result, and the complete arm builds the dataflow products and manifest from the complete source model.

The source-model builder contract version is raised from 1 to 2. The manifest builder contract version is raised from 9 to 10 because its source-model continuation boundary changed.

## Trace

`CLI scan/sync → RouteSyncCliManifestScanOperationInterface → ManifestBuilderOperationPreparationInterface.prepare → ManifestBuilderInterface.build → LaravelSourceAstPipelineInterface.execute → AST judgment continuation → CompleteLaravelSourceModelBuilderInterface.build → CompleteSourceModelBuildResult.continueToManifestBuild → dataflow manifest surface → ManifestBuilderJudgment.continueToFlow → CLI flow projection`.

The AST judgment still uses its existing generic `continueWith<Result>` operation. This phase intentionally does not rewrite that separate contract without a full audit of all AST projection consumers and the AST contract's receipt generic. Filesystem read failures in the route scanner also remain a separate open boundary.

## Verification

Run `npm run audit:phase2937-source-model-manifest-continuation` for the structural audit. This audit checks contract ownership, continuation operations, the absence of the source-model discriminator branch in the manifest builder, explicit barrel export, contract versions, and that `packages/core/src/types/upstream/collections.ts` is 0 bytes.

This phase does not claim a successful TypeScript typecheck, Vitest run, build, or CLI end-to-end test. The archive does not contain `node_modules`; the available global TypeScript is 5.8.3, while the project configuration uses `ES2025`, which that compiler version does not accept.
