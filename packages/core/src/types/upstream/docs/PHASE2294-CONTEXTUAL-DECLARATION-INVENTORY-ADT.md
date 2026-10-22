# Phase 2294 — Contextual Declaration Inventory ADT (Interface First)

## Scope

This phase evolves only the existing upstream Laravel attribute scanner contract, its contract documentation, trace report, and structural audit. It does not change producer, pipeline, CLI, or runtime.

## Trace finding

Phase 2293 made each class's `implements` clause a recursive source-ordered ADT, but the project-level `LaravelContextualAttributeInventory.declarations` remained `readonly LaravelContextualAttributeDeclarationEvidence[]`. Consequently, the most important project-wide semantic inventory still expressed closure as a convention around an array plus `closed: true`, rather than as a closed sequence shape.

## Contract change

`LaravelAttributeScannerInterface` is evolved in place from contract version 11 to 12.

- `LaravelContextualAttributeDeclarationSequence` has explicit empty and entry variants.
- Each entry contains one contextual declaration and a recursive `rest`, preserving traversal order.
- `LaravelContextualAttributeInventory.declarations` now uses that ADT; a complete empty inventory is represented by the explicit empty variant, not an empty array that could also be confused with an unclosed intermediate collection.
- The complete and blocked scan judgments and the scanner interface all advertise contract version 12.

The type states the required output shape; it does not prove the producer actually visited every file. The producer must establish discovery completeness, deterministic ordering, and that no blocked file was omitted before returning the complete variant.

## CLI trace and migration boundary

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `manifestBuilder.build(...)` / `constructRouteSyncManifest(...)` in `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `laravelSourceAstPipeline.execute(...)` → injected `LaravelAttributeScannerInterface.scan(...)` → `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts` → contextuality judgment → `LaravelControllerScannerInterface`.

This phase intentionally does not modify implementation files. The producer still constructs the older `declarations` array and older per-declaration evidence shape, and the pipeline still advertises the earlier scan contract version. Therefore this phase is contract-only and not integrated/build-ready.

`attributeProducer.ts` still imports `semantic/relations`; this phase does not add any dependency on `semantic/relations` or `semantic/foundation`.

## Validation boundary

The phase audit checks the recursive project-level declaration sequence, synchronized contract version, and unchanged producer/pipeline boundary. It is a structural audit, not a TypeScript typecheck, fixture test, or build.
