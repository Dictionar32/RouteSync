# Phase 2176 — Interface-First Closed DTO Discovery Producer

## Trace result

`scanDtoAsts()` previously used `collectPhpFiles()`, whose missing-root behavior returned an empty array. That erased the distinction between a valid empty scan and a scan whose declared root did not exist. The scanner also returned only `DtoAst[]`, so it could not publish the discovery closure contract introduced by the upstream DTO declaration interface.

## Changes

- Added `scanDtoDeclarationInventory()` to the existing canonical DTO scanner. No new subscanner, `relation` layer, `foundation` layer, or duplicate name-resolution authority was introduced.
- Discovery now emits `laravel_project_dto_declaration_inventory_complete` or `laravel_project_dto_declaration_inventory_incomplete`.
- Missing root, unreadable directory, unreadable source file, and declaration parse failure are represented by explicit blockers.
- Incomplete inventories retain partial discovered-file and declaration evidence rather than collapsing to an empty list.
- PHP files with no class declaration are considered but do not become false parse failures.
- DTO class identities remain explicitly unresolved with `class_name_resolution_context_unavailable`. The scanner does not guess a qualified name from a short class token or filename; namespace/import context must be passed through the existing `PhpClassNameResolutionRuleInterface` before positive declaration judgments can be issued.
- `scanDtoAsts()` is now a compatibility projection over the closed inventory and throws when discovery is incomplete. It no longer silently converts a missing root into an empty DTO list.
- Inventory contract version increased from 3 to 4 because incomplete inventories now retain partial evidence and directory-read failures have a distinct blocker.

## Remaining architecture gap

The controller scanner and integrated response pipeline still consume `dtoInventory: readonly DtoAst[]`. This phase closes the discovery producer and prevents silent empty inventories, but it does **not** claim that `LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface` is wired into the integrated response judgment. The next phase should propagate the closed inventory through `LaravelControllerScanInput` and `LaravelControllerResponseIntegratedJudgmentInput`, then connect the existing class-name authority and DTO declaration judgment before retiring the legacy raw-array response path.

The invocation semantic judgment owner remains unchanged. Runtime execution must delegate to existing authorities and must not classify class names or reconstruct response meaning.

## Validation

- Static source trace completed for the DTO scanner, scanner input, integrated response input, and response pipeline.
- ZIP integrity checked after packaging.
- Full build, TypeScript typecheck, and test suite were not run.
