# Phase 2835 — Manifest drift domain continuation

## Runtime trace

`driftAuditor.auditManifestDrift` → `controllerInvocationManifestBuilder.build` → `routeSyncCliManifestScanOperationFactory.create(...).scan` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → canonical project identity → controller-source discovery → source read and identity binding → source invocation semantic pipeline and delivery → upstream invocation judgment authority → inventory closure authority → manifest builder → `ControllerInvocationManifestDriftAuditContinuationInterface.continueForDriftAudit` → drift-specific terminal action.

## Change

The `ControllerInvocationManifest` discriminated union was already explicit, but the drift-audit consumer had duplicated its terminal dispatch inline. The new domain-specific continuation contract routes every closed variant to a named handler: complete manifest, blocked manifest build, inventory rejection, source-discovery block, project identity block, source-document acquisition block, and source-document identity rejection. The continuation includes an exhaustive `never` check. The drift auditor consumes this operation and only proceeds to route comparison after the complete handler supplies a manifest.

This is a drift-audit domain continuation, not a generic visitor or reasoning primitive. Existing upstream contracts remain the source of semantic authority; no duplicate core contract was added. Runtime operation and types are explicitly exposed through the PHP parser barrel. `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification boundary

`audit:phase2835-manifest-drift-domain-continuation` checks source structure, variant coverage, exhaustive dispatch, consumer usage, barrel exposure, and the empty collections file. It does not establish full TypeScript typecheck, build, or end-to-end runtime success.
