# Phase 2900 — Upstream source-discovery judgment factory

## Root cause

The CLI composition runtime had the canonical `LaravelControllerSourceDiscoveryEvidence` and `LaravelControllerSourceDiscoveryResult` contracts available, but manually decorated evidence with `continueWith` in the CLI implementation. That placed ADT-construction knowledge in the composition layer instead of the upstream owner of the discovery contract.

## Change

- Reused the existing discovery evidence/result ADT in `laravelControllerInvocationSemanticJudgmentInventoryInterface.ts`.
- Added `LaravelControllerSourceDiscoveryJudgmentFactoryInterface` and its interface-first `laravelControllerSourceDiscoveryJudgmentFactory` runtime export beside that ADT.
- The factory attaches `continueWith` to both complete and blocked evidence variants, preserving the blocked evidence and partial-source ledger.
- CLI composition now delegates to the factory rather than building a second local continuation object.
- Exported the new factory and named contracts through the core public barrel. The upstream barrel already exports the owning module.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Runtime trace

`controllerInvocationManifestBuilder.build(input)` → `routeSyncCliManifestScanOperationFactory.create(authority).scan(input)` → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → `LaravelControllerSourceDiscoveryInterface.discover(input)` → filesystem discovery evidence → `laravelControllerSourceDiscoveryJudgmentFactory.create(evidence)` → `LaravelControllerSourceDiscoveryResult.continueWith(handlers)` → source-document reads / terminal blocked outcome → semantic judgment inventory closure → manifest builder judgment continuation → CLI terminal manifest ADT.

## Scope and limits

This change moves construction of discovery continuations to the upstream ADT owner; it does not claim that filesystem traversal itself is free of branching or mutable local accumulation. Those are separate algorithmic concerns and should not be hidden by this factory. Structural audit results do not substitute for TypeScript typechecking, full tests, build, or CLI end-to-end validation.
