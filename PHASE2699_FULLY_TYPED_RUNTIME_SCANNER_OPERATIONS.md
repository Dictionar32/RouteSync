# Phase 2699 — Fully Typed Runtime Scanner Operations

## Objective

Continue the interface-first runtime refactor on the live upstream CLI manifest path, not in examples. Remove the exported `createRouteManifestProjectionComposition(...)` factory function and expose the same capability through a named interface and a frozen object:

```ts
export interface RouteManifestProjectionCompositionFactoryInterface {
  readonly create: (
    pipeline: RequestTypeDerivationSemanticPipelineInterface,
  ) => RouteManifestProjectionCompositionInterface;
}

export const routeManifestProjectionCompositionFactory:
  RouteManifestProjectionCompositionFactoryInterface = Object.freeze({
    create: (pipeline: RequestTypeDerivationSemanticPipelineInterface) => {
      // Existing authority-backed projection implementation.
    },
  });
```

## Runtime trace audited

```text
CLI scan / sync
  -> composition.manifestScanOperation.scan(input)
  -> upstream manifest scan / source discovery / source-document acquisition
  -> manifest-bound preflight
  -> routeManifestProjectionCompositionFactory.create(canonicalPipeline).project(preflight, ...)
  -> authority-backed semantic judgment
  -> projected: lower manifest
     blocked: preserve closed blocked result; do not lower or fall back
```

The canonical source acquisition object remains the same `SourceFileAcquisitionInterface` contract introduced in Phase 2698 and is used by semantic source-AST evidence acquisition and the live scanner consumers.

## Changes

- Added `RouteManifestProjectionCompositionFactoryInterface`.
- Replaced the exported free factory function with `routeManifestProjectionCompositionFactory: RouteManifestProjectionCompositionFactoryInterface = Object.freeze({...})`.
- Migrated CLI `scan`, CLI `sync`, and integrated manifest authority to `.create(...)`.
- Updated the core public export to expose the object and its type.
- Added `audit:phase2699-fully-typed-runtime-scanner-operations`.

## Verification boundary

The audit checks source-level trace contracts and TypeScript transpile syntax only. A full project typecheck, package build, and end-to-end CLI scan/sync run are not claimed.

**Known upstream blocker:** Phase 2636 documents that the production RequestType semantic reasoning operation and independent verifier for all 34 canonical obligations are not yet supplied. This refactor does not fabricate judgments, bypass the verifier, or weaken fail-closed behavior. The semantic kernel remains the source-level blocker to successful authority-backed manifest projection.
