# Phase 2867 — Upstream Manifest Interface-First Authority

## Change

The exported composition-root value `laravelControllerInvocationSemanticJudgmentAuthority` now explicitly uses the existing `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` contract:

```ts
export const laravelControllerInvocationSemanticJudgmentAuthority: LaravelControllerInvocationSemanticJudgmentAuthorityInterface =
  new LaravelControllerInvocationSemanticJudgmentAuthority({
    sourceBinding: phpSourceInvocationSemanticSourceBindingAuthority,
    integration: phpSourceInvocationSemanticPipelineIntegrationAuthority,
  });
```

This reuses the existing upstream contract rather than creating a duplicate interface. The contract's `judge(input)` operation consumes the closed `LaravelControllerInvocationSemanticInput` ADT and returns `LaravelControllerInvocationSemanticJudgmentInterface`; its runtime authority preserves the distinct `not_connected`, `source_binding_rejected`, `complete`, and `blocked` cases.

## CLI manifest runtime trace

`scan` / `sync` → `composition.manifestScanOperation.scan(input)` → `routeSyncCliManifestScanOperationFactory` (typed by `RouteSyncCliManifestScanOperationFactoryInterface`) → `controllerInvocationManifestCompositionAuthority.compose(input)` → upstream source binding and controller-invocation semantic judgment → `ControllerInvocationManifest.continueForDriftAudit(handlers)` → CLI projection.

The upstream semantic judgment authority and the CLI manifest composition authority have distinct responsibilities; this change does not replace the canonical manifest builder or create a second judgment wrapper. `packages/core/src/types/upstream/collections.ts` remains empty.

## Validation

Run `npm run audit:phase2867-upstream-manifest-interface-first-authority`. The audit checks 8/8 structural conditions: reuse of the existing interface, closed input/output contract, preservation of all four semantic outcomes, interface-first CLI scan factory, canonical composition authority, scan/sync runtime wiring and domain continuation, and empty `collections.ts`.

The scoped inventory contains 796 production TypeScript files. The audit's deliberately narrow one-line arrow-export heuristic identifies four remaining unannotated exported arrows in `semanticDataflowKnowledge.ts`; they are outside the manifest composition authority touched in this phase and remain follow-up candidates. This count is not a claim about every callable export form. Phase 2866's broader inventory recorded 173 `semantic/relations` import statements across 86 files; this phase does not migrate those unrelated imports.

This is a structural audit, not evidence of a successful full typecheck, test suite, package build, or CLI end-to-end run.
