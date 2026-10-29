# Phase 3112 — Retire the Laravel Discovery Generic Continuation Visitor

## Objective

Continue the upstream → CLI → manifest migration by removing the unused generic `continueWith<Result>` visitor from the Laravel controller source-discovery ADT. The runtime already consumes the fixed `projectForManifest()` projection and named `continueCompleteDiscovery`, `includeSource`, and `block` operations. Keeping a generic visitor in the same ADT would preserve an alternate, less explicit continuation contract.

## Change

- Removed `LaravelControllerSourceDiscoveryCompleteHandlers<Result>` from the discovery contract.
- Removed `continueWith<Result>` from complete and blocked discovery result objects.
- Removed the obsolete type from the core public type exports.
- Added a regression asserting both complete and blocked discovery results expose the named domain operations and do not expose `continueWith`.
- Added an AST-backed audit and package command `audit:phase3112-retire-discovery-generic-visitor`.

## Runtime trace

`controllerInvocationManifestCompositionAuthority.compose` → `canonicalProjectCompositionOperation.compose` → `sourceDiscovery.discover` → `discovery.projectForManifest()` → blocked terminal manifest or discovered-source continuation → source reads → semantic judgment inventory → manifest terminal/output.

The core-owned projection continues to preserve the original project identity, root, complete source inventory or blocked partial inventory, blocker, and original blocked judgment. Core does not import CLI manifest types. Deleted relation foundation modules are not restored.

## Explicit boundary

This phase removes the generic visitor from this specific discovery ADT; it does not claim that every generic continuation, exported function, primitive, or control-flow construct across the repository has been removed. The AST audit reports remaining exported function declarations and exported arrow/function-expression declarations. Full typecheck, complete test suite, and PHP → CLI → manifest → generator end-to-end verification are not marked as passed because they were not run here.
