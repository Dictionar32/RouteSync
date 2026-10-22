# Phase 2290 — Attribute Interface Inventory Closure (Interface First)

## Scope

This phase changes upstream contracts only. It intentionally does not edit the attribute producer, scanner implementation, pipeline wiring, CLI, or runtime executor.

## Contract gap found in Phase 2289

`LaravelAttributeNonContextualDeclarationJudgment.resolvedInterfaces: readonly ...[]` represented the list of successfully resolved interfaces but did not encode that the list was exhaustive. A consumer could not distinguish an empty, complete `implements` inventory from a list that had not yet been fully discovered. The positive declaration proof likewise did not carry the complete inventory that contextuality was judged against.

## Upstream contract change

`laravelAttributeScannerInterface.ts` now defines `LaravelAttributeResolvedInterfaceInventory` with:

- discriminant `laravel_attribute_resolved_interface_inventory`;
- `closed: true`;
- `interfaces`, each preserving resolved name evidence and source provenance.

Both positive `LaravelContextualAttributeDeclarationEvidence` and negative `LaravelAttributeNonContextualDeclarationJudgment` require this closed inventory. Therefore, positive and negative judgments refer to the same semantic boundary: the complete set of interfaces declared by that class. An empty inventory means no interfaces were declared only when discovery and resolution are complete.

The existing scanner outcome algebra remains complete-versus-blocked. Its contract version is advanced from 7 to 8 to record this upstream shape change. No parallel `v2` interface is introduced, and no generic wrapper is added.

## CLI trace (source inspection)

`packages/cli/src/commands/scan.ts` → `packages/core/src/compiler/scanner/wiring/controllerInvocationManifestComposition.ts` → `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` → `LaravelAttributeScannerInterface.scan(...)` → attribute scan producer → complete/blocked scan judgment → controller scanner (complete inventory only).

The current implementation still constructs the Phase 2289 shape (`resolvedInterfaces` directly) and does not yet construct `interfaceInventory`. That mismatch is deliberately left visible: Phase 2290 is contract-first, not an implementation cutover. The next phase must adapt the producer to this contract before the contract is considered integrated.

## Constraints

- No `semantic/foundation` import.
- No new `semantic/relations` import.
- No producer, wiring, or runtime changes in this phase.
- No TypeScript build/typecheck claim is made.
