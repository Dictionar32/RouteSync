# Phase 2308 — Constructor Selection Interface-First Audit

## Scope

This phase is deliberately interface-first. It does not wire the new evidence contract into the scanner executor and does not claim the runtime migration is complete. It strengthens the upstream vocabulary before the next wiring phase.

## Trace from Phase 2307

`CLI scan` → `controllerInvocationManifestComposition` → `LaravelSourceAstPipeline` → `LaravelAttributeScannerInterface` / `LaravelControllerScannerInterface` → `LaravelControllerScannerExecutor` / `attributeProducer` → `PhpClassConstructorSelectionAuthorityInterface`.

Both consumers now call the same authority, but the authority's active `select` input is still a raw sequence of method declarations. That means the type system does not prove that the sequence is complete. An incomplete sequence could incorrectly produce `php_class_constructor_missing` or `php_class_constructor_selected`.

## Interface change

Added `PhpClassMethodDeclarationInventory<TMethod>` to the existing `phpClassConstructorSelectionInterface.ts`:

- `php_class_method_declaration_inventory_complete` carries the fully enumerated source-correlated method declarations.
- `php_class_method_declaration_inventory_blocked` carries a non-empty blocker ledger for incomplete enumeration or parse failure.

This is an evidence inventory, not a second constructor-selection authority. The existing `PhpClassConstructorSelectionAuthorityInterface` remains the single semantic owner. Its active method is intentionally unchanged in this phase so the repository is not left with partially migrated production wiring.

## Required next phase before wiring is complete

1. Evolve the existing authority contract so selection consumes only a complete `PhpClassMethodDeclarationInventory`; a blocked inventory must remain blocked and cannot be converted to `missing`.
2. Evolve `LaravelAttributeScannerInterface` and `LaravelControllerScannerInterface` in place so their input/output judgments preserve inventory completeness and blocker provenance.
3. Wire the parser's actual declaration-enumeration result into that contract; do not manufacture `complete` from an ordinary array.
4. Only then update the authority implementation and consumers. Runtime must execute the closed upstream judgment rather than classify partial evidence.
5. Trace the blocked judgment through CLI and manifest publication.

## Boundaries preserved

- No `semantic/foundation` imports.
- No new `semantic/relations` imports.
- No duplicate constructor authority or `v2`/`legacy` scanner interface.
- No runtime or CLI wiring changed in this interface-only phase.

## Verification status

This is a structural interface-contract phase, not a build claim. The focused audit verifies the new closed inventory variants and confirms production wiring remains unchanged. Typecheck, build, and integration tests were not run.
