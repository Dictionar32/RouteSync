# Phase 2873 — Canonicalization Domain Continuation

## Scope

This phase makes the project-root canonicalization judgment operational at the CLI manifest boundary. It changes one real branch in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`; it does not claim the whole manifest composition is branch-free.

## Before

`compose` awaited `canonicalize(...)`, inspected `identity.kind`, returned a terminal on the blocked arm, then read `identity.canonical` on the success arm. The judgment was a data-only union and its consumer owned the dispatch.

## After

`ControllerSourceProjectIdentityCanonicalizationResult` is a union of two domain judgments, each carrying `continueWith(handlers)`. The canonicalization producer attaches that operation at construction. `compose` delegates to `identity.continueWith(...)` and routes the successful identity to `composeCanonicalProject`; the blocked arm maps to the existing source-project-identity terminal. No generic result abstraction was added.

```ts
return identity.continueWith({
  onBlocked: blockedIdentity => Promise.resolve(
    controllerInvocationManifestTerminalOperationsFactory.sourceProjectIdentityBlocked(
      Object.freeze({
        kind: 'controller_invocation_manifest_source_project_identity_blocked',
        identity: blockedIdentity,
      }),
    ),
  ),
  onCanonicalized: canonicalIdentity =>
    composeCanonicalProject(canonicalIdentity.canonical, input, dependencies),
});
```

## Trace

`controllerInvocationManifestBuilder.build` → `routeSyncCliManifestScanOperationFactory.create(...).scan(...)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(...)` → `sourceProjectIdentityCanonicalization.canonicalize(...)` → judgment `continueWith(...)` → either existing blocked terminal or `composeCanonicalProject(...)` → discovery → source reads and identity binding → invocation semantic pipeline → inventory closure → `ManifestBuilderJudgment.continueWith(...)` → `ControllerInvocationManifest.continueForDriftAudit(...)`.

## Remaining domain decisions

Discovery, identity binding, and source reads still contain discriminant checks and collection filtering in composition. Those should be handled in separate, domain-specific changes after checking their existing upstream contracts. Do not introduce a generic `Result<T>`, a generic collection helper, or interfaces for every helper. Do not equate AST failure with an empty manifest. `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification boundary

The Phase2873 audit is a structural source check, not a full TypeScript typecheck or end-to-end test. No build or end-to-end success is claimed unless run separately.
