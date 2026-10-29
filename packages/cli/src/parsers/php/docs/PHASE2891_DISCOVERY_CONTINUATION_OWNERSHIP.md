# Phase 2891 — Discovery Continuation Ownership Audit

## Scope

Trace the Laravel controller discovery segment of the upstream CLI manifest path and identify the exact ownership boundary for complete/blocked decisions. This phase is an audit; it intentionally does not claim a runtime migration.

## Runtime trace

`controllerInvocationManifestBuilder.build(...)` → CLI manifest scan operation → `ControllerInvocationManifestCompositionAuthority.compose(...)` → project identity canonicalization → `LaravelControllerSourceDiscoveryInterface.discover(...)` → discovery continuation → source document batch reads → source identity binding → semantic judgment preparation → inventory closure → manifest builder judgment → CLI projection/output.

## Existing contract reused

`packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` already declares `LaravelControllerSourceDiscoveryEvidence`, `LaravelControllerSourceDiscoveryResult`, `LaravelControllerSourceDiscoveryJudgmentOperations`, and `LaravelControllerSourceDiscoveryInterface`. Do not create a second discovery contract.

## Findings

1. The consumer uses `discovery.continueWith(...)`, but the producer still classifies `evidence.kind` while attaching the continuation. Decision ownership is therefore only partially moved into the result.
2. `continueWith<Result>` is generic because core cannot know the CLI composition's return type. Removing that generic requires an explicit domain-level continuation contract that respects the core/CLI dependency direction. Do not replace it with a generic helper, a fake fixed return value, or a second authority.
3. `Promise.all(discoveredSources.map(...))` is batch scheduling. Before changing it, strengthen/reuse the source-read batch result ADT so complete/blocked/rejected outcomes remain explicit and failures cannot become a successful empty manifest.
4. Phase2890's `SourceFile` identity preservation remains in place. `packages/core/src/types/upstream/collections.ts` remains empty.

## Next implementation seam

Model the source-read batch as a domain-owned result with operations that can produce the composition's next domain judgment without making core import CLI types. Then migrate all call sites together and run project typecheck/tests when dependencies are available. Until then, do not claim the migration or tests pass.
