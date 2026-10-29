# Phase 2833 — Upstream Pipeline Contract Reuse

## Scope

Tighten the active CLI manifest path by reusing the existing upstream PHP invocation pipeline contract rather than keeping a duplicate CLI-local operations interface.

## Runtime change

`packages/cli/src/parsers/php/sourceInvocationPipeline.ts` now exports `phpSourceInvocationSemanticPipelineOperations` as an explicitly typed, frozen `PhpSourceInvocationSemanticPipelineInterface` value. It provides the domain `analyze(document)` operation and delegates semantic work to the existing `createPhpSourceInvocationSemanticPipelineAuthority` result.

The local `PhpSourceInvocationSemanticPipelineOperationsInterface` and its unused `analyzeBatch` convenience wrapper were removed. Batch delivery remains the responsibility of the existing `PhpSourceInvocationSemanticPipelineDeliveryInterface` and `phpSourceInvocationSemanticPipelineDelivery` operation, which the composition runtime already uses.

This avoids creating a second contract for behavior already represented upstream. No new reasoning primitive, semantic authority, manifest ADT, or generic visitor was added.

## Manifest trace

`RouteSyncCliManifestScanOperationInterface.scan(input)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → source discovery and source identity binding → `phpSourceInvocationSemanticPipelineOperations.analyze(document)` → existing `phpSourceInvocationSemanticPipelineDelivery.deliver(results)` → invocation judgment authority → inventory authority → existing manifest builder preparation → `ManifestBuilderJudgment` → projection/output boundary.

The complete/blocked pipeline result remains source-bound. Delivery does not reclassify results. Inventory rejection is still preserved as a terminal composition result, and a blocked source AST must not be presented as a successful manifest.

## Audit

Run `node scripts/audits/audit-phase2833-upstream-pipeline-contract-reuse.cjs`.

The structural audit verifies existing contract reuse, frozen interface-first runtime export, authority delegation, delivery ownership, composition injection, barrel boundary, package script registration, and that `packages/core/src/types/upstream/collections.ts` remains empty.

Structural audit success does not establish full TypeScript typecheck, package build, or end-to-end CLI manifest execution.
