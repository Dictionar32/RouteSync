# Phase 2293 Trace — Interface First

## Existing CLI path

`packages/cli/src/commands/scan.ts` → `packages/core/src/compiler/scanner/wiring/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface.scan(...)` → `packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts` → contextuality judgment → `LaravelControllerScannerInterface`.

## Contract finding

Phase 2292's proof was a linked evidence object, but it remained a detached sibling of the inventory. Its actual membership in the inventory was not represented by the contract. A readonly array also left source ordering/completeness as an implicit collection convention.

## Phase 2293 contract

`LaravelAttributeResolvedInterfaceSequence` is an empty/entry recursive ADT. A general closed inventory owns its source-clause provenance and sequence. The contextual inventory owns `before`, the implementation proof as the actual member, and `after`; the contextual declaration no longer carries a second detached implementation field.

## Not changed / not verified

- Producer remains on the old shape and contract version 7.
- `laravelSourceAstPipeline.ts` remains on its old shape/version.
- `attributeProducer.ts` still imports `semantic/relations`.
- No TypeScript typecheck, test suite, or build was run.
- No import from `semantic/foundation` or `semantic/relations` was added by this phase.

## Next migration sequence

1. Validate this upstream ADT against PHP declaration fixtures and source-span provenance.
2. Migrate the producer to construct the sequence ADT and the contextual before/implementation/after partition.
3. Migrate the existing pipeline and CLI consumer to the version 11 complete/blocked judgment.
4. Remove the remaining `semantic/relations` ownership from `attributeProducer.ts` through the correct upstream contract, not by moving the implementation to another file.
