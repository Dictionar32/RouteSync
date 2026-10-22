# Phase 2293 — Contextual Interface Inventory ADT (Interface First)

## Scope

This phase evolves only the existing upstream Laravel attribute scanner contract, its documentation, and a structural audit. Producer, pipeline, CLI, and runtime are intentionally not changed.

## Gap found in Phase 2292

The contract used a readonly array for the resolved interface inventory and kept the contextual implementation proof as a separate field. The proof was individually linked to a source declaration and resolution, but its membership in the inventory remained a producer obligation. In addition, the inventory's `closed: true` marker did not encode an ordered closed sequence shape.

## Contract change

`LaravelAttributeScannerInterface` is evolved in place from contract version 10 to 11.

- `LaravelAttributeResolvedInterfaceSequence` is a recursive empty/entry ADT preserving source order without a raw array for the closed declaration sequence.
- `LaravelAttributeResolvedInterfaceInventory` owns the source-clause provenance and closed sequence for non-contextual declarations.
- `LaravelContextualAttributeResolvedInterfaceInventory` partitions the same source-order sequence into `before`, one `implementation` proof, and `after`. The proof is embedded as the inventory member rather than carried as a detached sibling property on the contextual declaration judgment.
- `LaravelContextualAttributeDeclarationEvidence` now carries the contextual inventory as its single source of interface-membership evidence.

The contract still relies on the producer to prove that the source clause was fully enumerated, that `before` and `after` preserve the remaining order, and that exactly one canonical Laravel contract entry was selected. TypeScript structural types cannot independently prove parser completeness or semantic uniqueness.

## Trace and migration boundary

The known CLI route remains:

`packages/cli/src/commands/scan.ts` → `controllerInvocationManifestComposition.ts` → `laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface.scan(...)` → `attributeAstCanonical.ts` → contextuality judgment → controller scanner.

No producer or wiring files are changed in this phase. The current producer still emits the older `resolvedInterfaces`/detached proof shape and uses contract version 7; the pipeline also remains on the older version. Thus Phase 2293 is an upstream contract definition, not an integrated or build-ready change.

`attributeProducer.ts` still imports `semantic/relations`. No new `semantic/foundation` or `semantic/relations` imports are introduced.

## Validation

The Phase 2293 structural audit checks the recursive inventory ADT, the embedded contextual implementation member, synchronized version 11 declarations, and explicitly records the producer/pipeline mismatch. It is not a TypeScript typecheck or build.
