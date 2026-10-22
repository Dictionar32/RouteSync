# Phase 2294 Trace — Interface First

## Existing CLI path

`packages/cli/src/commands/scan.ts` → `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` → `manifestBuilder.build(...)` / `constructRouteSyncManifest(...)` in `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` → `laravelSourceAstPipeline.execute(...)` → injected `LaravelAttributeScannerInterface.scan(...)` → `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts` → contextuality judgment → `LaravelControllerScannerInterface`.

## Contract gap

Phase 2293 closed the per-class `implements` inventory with a recursive ADT, but project-wide `LaravelContextualAttributeInventory.declarations` remained an array. The outer inventory therefore still relied on a collection convention to represent a complete empty set.

## Phase 2294 change

The existing `LaravelAttributeScannerInterface` contract is version 12. `LaravelContextualAttributeDeclarationSequence` explicitly models empty and entry variants, and the project inventory now carries this sequence rather than a declaration array. Complete, blocked, and scanner contract versions are synchronized.

## Remaining integration work

- `attributeAstCanonical.ts` still produces the older declaration and interface-evidence shapes.
- `laravelSourceAstPipeline.ts` still uses the previous scan contract version.
- `attributeProducer.ts` still imports `semantic/relations`.
- No TypeScript typecheck or build was run.

## Next migration sequence

1. Validate project-level completeness and deterministic traversal with PHP fixtures.
2. Migrate the producer to fold completed source declarations into `LaravelContextualAttributeDeclarationSequence` and preserve blocked outcomes.
3. Migrate the existing pipeline and CLI consumer to contract version 12.
4. Remove `semantic/relations` ownership from `attributeProducer.ts` through the proper upstream-owned contract, without introducing `semantic/foundation`.
