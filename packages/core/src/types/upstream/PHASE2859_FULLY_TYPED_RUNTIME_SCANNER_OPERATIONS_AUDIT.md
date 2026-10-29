# Phase 2859 — Fully Typed Runtime Scanner Operations Audit

## Scope

This phase tightens the AST semantic transition boundary used by the upstream semantic authority pipeline. It does not claim that every arrow export in the full repository has already been migrated, nor does it remove the remaining `semantic/relations` dependencies globally.

## Runtime trace

`CLI scan/sync` → `routeSyncCliManifestScanOperationFactory` → `controllerInvocationManifestCompositionAuthority` → invocation inventory judgment → `continueWith` (`onValidated` / `onRejected`) → manifest builder preparation and manifest terminal operations.

The upstream AST-semantic authority pipeline is a parallel semantic path: stage interfaces → `requireTransition` → `astSemanticStageTransitionAuthority.transition` → typed transition proof → pipeline transition list. The new authority exposes `continueWith` so a consumer can handle valid transition and rejected transition outcomes at the domain boundary instead of unpacking the option representation itself.

## Interface-first change

`astSemanticStageTransition`'s exported arrow factory has been replaced with the private implementation `astSemanticStageTransitionImplementation` and the interface-first runtime export `astSemanticStageTransitionAuthority: AstSemanticStageTransitionAuthorityInterface`. The pipeline now calls the authority operation. The existing transition ADT variants and proof alignment are preserved.

## Verification

Run `npm run audit:phase2859-fully-typed-runtime-scanner-operations`. This is a structural audit, not a full typecheck. `packages/core/src/types/upstream/collections.ts` must remain empty. Existing `semantic/relations` imports are counted and reported rather than hidden or claimed migrated. Full TypeScript checking, Vitest, package build, and CLI E2E must be run in a complete dependency-installed checkout before declaring those gates passed.
