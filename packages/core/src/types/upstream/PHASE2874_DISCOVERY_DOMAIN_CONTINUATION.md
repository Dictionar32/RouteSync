# Phase2874 — Fully Typed Runtime Scanner Operations: Discovery Domain Continuation

## Change

The existing `LaravelControllerSourceDiscoveryResult` is now an executable domain ADT. Its complete and blocked variants retain their existing evidence payloads and each exposes `continueWith(handlers)`. The filesystem traversal uses `LaravelControllerSourceDiscoveryEvidence` internally while constructing results; the public `LaravelControllerSourceDiscoveryInterface.discover` result is decorated with the domain operation at the producer boundary.

The CLI composition now consumes `discovery.continueWith(...)` rather than inspecting `discovery.kind`. Complete discovery delegates to a named continuation that reads sources. Blocked discovery remains a distinct manifest terminal. The discovered project identity remains the source inventory's project claim; it is not relabeled with the requested identity.

## Manifest trace

`controllerInvocationManifestBuilder.build` → scan operation factory → scan operation `.scan` → `ControllerInvocationManifestCompositionAuthorityInterface.compose` → project canonicalization `.continueWith` → `LaravelControllerSourceDiscoveryInterface.discover` → `LaravelControllerSourceDiscoveryResult.continueWith` → source reads / identity binding → invocation pipeline → judgment inventory `.continueWith` → manifest builder `.continueWith` → `ControllerInvocationManifest.continueForDriftAudit`.

## Runtime contract guidance

- Reuse `LaravelControllerSourceDiscoveryInterface`; do not add a second discovery abstraction.
- Runtime discovery producer remains an interface-first `export const` operation.
- `continueWith` is attached to the domain result, so composition does not need a discriminator branch.
- Blocked discovery and partial evidence are not treated as an empty successful source set.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Verification limits

The focused Phase2874 audit is structural and checks source patterns/invariants. It does not prove TypeScript typechecking, full build success, or end-to-end behavior. Those must be run separately in an environment with the repository's pinned dependencies.
