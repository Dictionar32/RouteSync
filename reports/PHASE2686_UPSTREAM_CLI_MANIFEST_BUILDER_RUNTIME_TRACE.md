# Phase 2686 — Upstream CLI Manifest Builder Runtime Trace

## Scope

This audit traces the actual manifest-forming path rather than only the semantic composition example:

`createProgramFromSemanticComposition` → `composeRouteSyncCliUpstream` → `controllerInvocationManifestCompositionAuthority` → project identity canonicalization → controller source discovery → source document read and identity binding → source invocation pipeline and judgment delivery → inventory authority closure → `manifestBuilderOperationPreparation` with the validated inventory receipt → `scan` / `sync` request-resolution preflight → proof-producing manifest projection.

## Changes

- Added `scripts/audits/audit-phase2686-upstream-cli-manifest-builder-runtime-trace.cjs`.
- Registered `audit:phase2686-upstream-cli-manifest-builder-runtime-trace` in the root package scripts.
- The audit checks that `ControllerInvocationManifestCompositionAuthorityInterface` is annotated on the runtime value, that the manifest builder only receives the receipt from a validated inventory result, that rejected inventory remains a terminal ADT, and that both `scan` and `sync` call the injected authority and use preflight plus the projection ADT.
- The audit also checks the host example's `export const ...: RequestTypeDerivationSemanticPipelineCompositionInterface` name against the runtime loader and the published `./upstream` package export.

## Result

Run with `node scripts/audits/audit-phase2686-upstream-cli-manifest-builder-runtime-trace.cjs`.

This is a source-structure trace, not a substitute for a package build, TypeScript typecheck, Vitest, or end-to-end execution against a built package and a real Laravel source tree. Those runtime checks must be run in an environment with the repository's dependencies installed.
