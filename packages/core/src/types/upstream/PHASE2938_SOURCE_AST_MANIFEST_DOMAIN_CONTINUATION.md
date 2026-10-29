# Phase2938 — Source AST to Manifest Domain Continuation

## Goal

Remove the generic result continuation from the source-AST projection boundary used by upstream CLI manifest construction. Reuse the existing `ManifestBuilderJudgment` instead of allowing each consumer to choose an arbitrary `Result` type.

## Changes

- Replaced `LaravelSourceAstProjectionJudgmentHandlers<Receipt, Result>` with `LaravelSourceAstProjectionManifestBuildContinuationInterface<Receipt>`.
- Replaced `LaravelSourceAstProjectionJudgment.continueWith<Result>(...)` with `continueToManifestBuild(...)`, which returns `Promise<ManifestBuilderJudgment>`.
- Updated both producer operations (`complete` and `blocked`) to attach the domain-specific continuation.
- Updated `upstreamManifestBuilder` to call `projection.continueToManifestBuild(...)`.
- Bumped `LaravelSourceAstPipelineInterface.contractVersion` from 17 to 18 and aligned its runtime factory.
- Kept the existing AST complete/blocked union and exact blocker evidence; no duplicate judgment ADT was introduced.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Runtime trace

`CLI scan/sync` → `ManifestBuilderOperationPreparationInterface.prepare` → `ManifestBuilderInterface.build` → `LaravelSourceAstPipelineInterface.execute` → `LaravelSourceAstProjectionJudgment.continueToManifestBuild` → existing `ManifestBuilderJudgment` → source-model continuation → manifest flow projection.

The source-AST projection boundary is now specific to manifest construction. It no longer offers a generic result type at this boundary. The generic `Receipt` parameter remains because it preserves the exact invocation-inventory receipt subtype across AST outcomes; it is not a generic result/decision abstraction.

## Verification boundary

The phase audit script checks source structure, operation names, version alignment, barrel exposure, absence of `export function` in the scoped runtime files, and the empty collections invariant. Typecheck, tests, build, and CLI end-to-end are not claimed unless run successfully separately.
