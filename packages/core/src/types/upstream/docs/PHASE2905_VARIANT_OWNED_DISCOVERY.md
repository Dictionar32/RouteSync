# Phase 2905 — Variant-Owned Discovery Operations

## Root-cause addressed

The previous discovery factory accepted the whole `LaravelControllerSourceDiscoveryEvidence` union through `create(evidence)` and redispatched complete/blocked behavior with ternary expressions. This duplicated variant selection at the upstream ADT construction boundary and allowed consumers to rebuild decisions after the fact.

## Contract change

`LaravelControllerSourceDiscoveryJudgmentFactoryInterface` now exposes explicit `complete(evidence)` and `blocked(evidence)` constructors. Each constructor attaches its own `continueWith` behavior directly. The complete variant owns immutable `includeSource` and the transition to blocked; the blocked variant preserves its terminal evidence and does not reopen discovery when asked to include another source or block again.

The runtime remains interface-first with `export const ...: Interface = Object.freeze({...})`. The existing contract is evolved rather than introducing a second discovery abstraction. `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`controllerInvocationManifestBuilder.build(input)` → CLI manifest scan operation → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → `LaravelControllerSourceDiscoveryInterface.discover(input)` → filesystem boundary → variant-specific upstream constructor → result-owned `continueWith` / `includeSource` / `block` → source-document read and semantic inventory → manifest builder judgment → CLI terminal manifest ADT.

## Remaining audit scope

The filesystem adapter still classifies OS errors and `Dirent` entry kinds. These are not claimed to be eliminated by this phase. A follow-up must inspect existing upstream contracts before introducing a typed filesystem boundary result; it must not merely move ternaries into a helper. Full project typecheck, build, complete test suite, and CLI end-to-end remain unverified unless separately executed.
