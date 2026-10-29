# Phase 2890 — Discovery Source Identity Preservation

## Goal

Continue the Fully Typed Runtime Scanner Operations audit on the actual upstream CLI manifest construction path. This phase reuses the existing `LaravelControllerSourceDiscoveryInterface`, `LaravelControllerSourceDiscoveryEvidence`, `LaravelControllerSourceDiscoveryResult`, and `LaravelControllerSourceDiscoveryJudgmentOperations` contracts instead of introducing a duplicate discovery authority.

## Runtime path

`controllerInvocationManifestBuilder.build(...)` → CLI manifest scan operation → `ControllerInvocationManifestCompositionAuthority.compose(...)` → source-project canonicalization → controller source discovery → source-document reads and identity binding → semantic judgment preparation → inventory closure → manifest builder judgment continuation → CLI projection/output.

## Change applied

In `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts`, discovery traversal now carries `SourceFile` identities in its accumulator instead of repeatedly converting `SourceFile` to a raw string and then recreating `SourceFile` instances:

- `discoverControllerPhpFiles(..., discovered)` now receives `readonly SourceFile[]`.
- Nested complete discovery preserves `nested.sources` as domain identities.
- Partial discovery results preserve existing `SourceFile` identities.
- A newly discovered PHP path is wrapped once at the filesystem boundary using `createSourceFile(entryPath)`.

Filesystem APIs still receive strings where required; this change does not pretend the Node filesystem API accepts domain objects.

## Deliberately not changed

- The existing discovery ADT contract was reused; no generic collection ADT was introduced.
- `Promise.all(discoveredSources.map(...))` was not removed mechanically: mapping each discovered source to an asynchronous read is a real batch operation, and the `.map` occurrence alone does not establish an upstream contract defect.
- The discovery producer's complete/blocked discrimination and the generic `continueWith` handler remain identified follow-up work. This phase does not claim to have removed all reasoning from discovery.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Validation

Run `npm run audit:phase2890-discovery-source-identity`. The script checks source identity preservation, reuse of the existing upstream contract, manifest continuation, absence of `export function` in the composition module, and the empty collections-file invariant. This structural audit is not a substitute for TypeScript typecheck, build, unit tests, or CLI E2E tests; those were not run as part of this phase.
