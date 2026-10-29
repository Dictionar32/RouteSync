# Phase 2901 — Immutable source-discovery traversal

## Root-cause finding

The Phase 2900 audit found that `discoverControllerPhpFiles` still used mutable `let` variables for directory entries and accumulated sources, and directly branched on the child result discriminator. This meant the domain continuation existed upstream but was not consistently used throughout recursive traversal.

## Change

- Reused the existing `LaravelControllerSourceDiscoveryEvidence`, `LaravelControllerSourceDiscoveryResult`, and `laravelControllerSourceDiscoveryJudgmentFactory`; no duplicate upstream result contract was introduced.
- Replaced mutable entry/source accumulators with an immutable ordered `reduce` pipeline. Each step creates a new frozen source snapshot.
- Routed both the current discovery evidence and recursive child evidence through the existing `continueWith` operation. A blocked result remains blocked for subsequent steps, and a nested blocker retains the partial source snapshot.
- Kept filesystem-specific `Dirent` classification at the filesystem adapter boundary. Directory/file/symlink classification is an environmental fact, not semantic reasoning about controller invocations; this phase does not claim to remove all branching from the filesystem adapter.
- Kept `packages/core/src/types/upstream/collections.ts` empty and introduced no generic collection abstraction.

## Runtime trace

`controllerInvocationManifestBuilder.build(input)` → CLI scan operation → `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)` → existing `LaravelControllerSourceDiscoveryInterface.discover(input)` → filesystem entry read → immutable ordered traversal → upstream `laravelControllerSourceDiscoveryJudgmentFactory.create(evidence)` → `LaravelControllerSourceDiscoveryResult.continueWith(handlers)` → source-document reads / preserved blocked outcome → semantic judgment inventory → manifest builder judgment → CLI terminal manifest ADT.

## Validation boundary

Run `node scripts/audits/audit-phase2901-immutable-discovery-traversal.cjs` and the prior Phase 2900 audit. The edited module was passed through TypeScript 5.8.3 `transpileModule` with zero syntax diagnostics. A full `tsc --noEmit -p tsconfig.json` attempt could not run successfully in this extracted workspace: dependencies and type definitions (`node`, `vitest/globals`) are absent, and the globally installed compiler rejects the project's `ES2025` target. This is an environment/toolchain limitation, not a successful typecheck. Build, full tests, and CLI end-to-end validation remain unverified.
