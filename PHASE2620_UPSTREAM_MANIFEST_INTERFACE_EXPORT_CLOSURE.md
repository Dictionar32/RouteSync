# Phase 2620 — Upstream Manifest Interface Export Closure

## Scope

Trace the Laravel route scan path through the CLI composition boundary and upstream manifest builder. Fix missing exports at their owning barrels without introducing a second contract or moving semantic work into the CLI.

## Root-cause findings

1. `ManifestBuilderInput`, `ManifestBuilderJudgment`, `ManifestBuilderInterface`, and `ManifestBuilderOperationPreparationInterface` were defined in `core/src/types/upstream/manifestBuilderInterface.ts` and individually exposed by `core/src/index.ts`, but the canonical `core/src/types/upstream/index.ts` barrel did not re-export that contract module. Consumers of the upstream barrel therefore saw an incomplete upstream public surface.
2. `SyntaxRange` and the `syntaxRange` operation were implemented in `compiler/frontend/php/routeAst/syntaxRange.ts`, but the `routeAst/index.ts` barrel did not expose either symbol. This was a genuine module-barrel gap, not evidence that the implementation itself was missing.
3. The active CLI path already injects `manifestComposition`, calls `compose(...)`, and receives the existing closed `ManifestBuilderJudgment` through the composition. The Core entry point already exports `prepareManifestBuilderOperation` and `manifestBuilderOperationPreparation`. Do not duplicate these contracts or add CLI-side semantic inference to compensate for export gaps.

## Changes

- Added `export * from './manifestBuilderInterface'` to the upstream type barrel.
- Added type and value exports for `SyntaxRange` and `syntaxRange` to the route-AST barrel.
- Added `scripts/audits/audit-phase2620-upstream-manifest-interface-export.cjs` to verify the export and active wiring boundaries.

## Canonical path traced

`CLI scan command → RouteSyncCliUpstreamCompositionInterface.manifestComposition → ControllerInvocationManifestCompositionAuthorityInterface.compose → manifestBuilderOperationPreparation.prepare(ManifestBuilderInput) → ManifestBuilderInterface.build() → LaravelSourceAstPipelineInterface.execute() → LaravelSourceAstProjectionJudgment → ManifestBuilderJudgment (complete | blocked) → CLI output gate`.

The CLI should remain presentation/orchestration only. Semantic judgment stays upstream; the existing closed ADT carries complete/blocked results. `export const name: Interface` is retained for the concrete preparation operation; the interface itself remains a type-only contract.

## Verification limits

The audit script is a structural wiring/export check. It does not prove TypeScript compilation, package build, runtime CLI success, or the absence of every unexported symbol across the repository. Those require the workspace's supported TypeScript/Vitest/build environment.
