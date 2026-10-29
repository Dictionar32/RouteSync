# Phase 2903 — Upstream Discovery Domain Operations

## Root cause addressed

The source-discovery ADT previously exposed continuation dispatch, but the CLI still constructed the next discovery evidence itself when a PHP file was found or a symbolic link blocked completeness. That left domain transitions owned by the consumer.

The existing `LaravelControllerSourceDiscoveryResult` now exposes `includeSource` and `block`. These operations preserve immutable source evidence, preserve the first blocking outcome, and return the same upstream result ADT with its continuation attached. The CLI calls those operations instead of assembling the corresponding evidence records itself. No duplicate contract was added.

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI scan operation → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → `LaravelControllerSourceDiscoveryInterface.discover(input)` → filesystem adapter → `laravelControllerSourceDiscoveryJudgmentFactory.create(evidence)` → `LaravelControllerSourceDiscoveryResult.includeSource / block / continueWith` → source-document reads → semantic judgment inventory closure → manifest builder judgment → CLI terminal manifest ADT.

## Boundary still requiring follow-up

The filesystem adapter still classifies Node `Dirent` values and translates filesystem errors. This is environment-boundary interpretation and has not been claimed as eliminated. The existing union of directory entries and discovery evidence (`Array.isArray` plus type assertions) remains another root-modeling issue to address in a subsequent focused phase. This phase does not claim full typecheck, build, test-suite, or end-to-end verification.

`packages/core/src/types/upstream/collections.ts` remains empty.
