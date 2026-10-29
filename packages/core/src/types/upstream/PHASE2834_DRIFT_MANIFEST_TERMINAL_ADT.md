# Phase 2834 — Drift audit terminal ADT closure

## Runtime trace

`driftAuditor.auditManifestDrift` → `controllerInvocationManifestBuilder.build` → `routeSyncCliManifestScanOperationFactory.create(...).scan` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → canonical project identity → controller source discovery → source document read and identity binding → source invocation semantic pipeline + delivery → upstream invocation judgment authority → inventory closure authority → manifest builder preparation → `ManifestBuilderJudgment`.

## Finding and correction

The drift audit already handled source read blocks, source discovery blocks, inventory rejection and upstream manifest-builder blocks, but did not explicitly handle project-root identity canonicalization blocks or source-document identity rejection. Those are members of the `ControllerInvocationManifest` closed union. Without explicit branches, the code could fall through toward manifest dereference rather than preserving the blocked/rejected outcome as terminal evidence.

The drift audit now handles both missing terminal variants and returns non-zero without treating them as a complete manifest. Existing upstream contracts and authorities remain the owners of identity binding, semantic judgments, inventory closure and manifest construction. No duplicate interface or generic reasoning primitive was introduced.

## Verification boundary

`audit:phase2834-drift-manifest-terminal-adt` is a source-structure audit, not a TypeScript typecheck or end-to-end execution. Full build/runtime verification remains separate.
