# Phase 2888 — Manifest ADT continuation at CLI composition boundary

## Goal

Continue the Fully Typed Runtime Scanner Operations migration on the canonical upstream → CLI manifest path. Reuse the existing `ManifestBuilderJudgment.continueWith` operation instead of having the CLI adapter inspect `judgment.kind` itself.

## Trace

`scan/sync/drift` → `controllerInvocationManifestBuilder.build` → `routeSyncCliManifestScanOperationFactory.create(...).scan(...)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → project identity canonicalization `continueWith` → source discovery `continueWith` → source reads and identity binding → semantic judgment preparation → inventory closure `continueWith` → manifest builder `build()` → `ManifestBuilderJudgment.continueWith` → CLI terminal operation → `ControllerInvocationManifest.continueForDriftAudit` → CLI projection/output.

## Change

`controllerInvocationManifestTerminalOperationsFactory.fromManifestBuilderJudgment` now delegates to the existing upstream ADT's `continueWith({ onComplete, onBlocked })`. The complete and blocked handlers only attach the corresponding CLI terminal operation. This removes a redundant downstream `kind` branch and preserves the exact upstream complete/blocked judgment payloads.

No new generic result type or helper abstraction was introduced. No new upstream contract was needed because `packages/core/src/types/upstream/manifestBuilderInterface.ts` already defines the operational ADT.

## Contract usage

```ts
fromManifestBuilderJudgment: judgment => judgment.continueWith({
  onComplete: completeJudgment => terminalOperations.complete(completeJudgment),
  onBlocked: blockedJudgment => terminalOperations.manifestBlocked(blockedJudgment),
})
```

## Scope and validation

This is a focused migration, not a claim that all runtime control flow or all `map` projections have been eliminated. `map` is not automatically a defect: each occurrence must be traced to its domain owner before replacement. The discovery implementation still binds `continueWith` at the producer boundary, and filesystem error classification still requires translating OS-level error evidence into domain blockers.

Audit assertions: the adapter uses `judgment.continueWith`; the old `judgment.kind === 'manifest_builder_complete'` branch is absent; no `export function` is introduced in the two manifest composition modules; `packages/core/src/types/upstream/collections.ts` remains empty.

Full workspace typecheck, build, test suite, and CLI E2E are not claimed as passed in this environment.
