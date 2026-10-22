# Phase 2177 — Closed DTO Inventory at the Laravel Scanner Boundary

## Trace finding

The DTO producer emitted a closed complete/incomplete inventory, but `LaravelControllerScanInput` still accepted `readonly DtoAst[]`. That discarded discovery closure at the scanner boundary and allowed callers to bypass the producer's proof.

## Change

- `LaravelControllerScanInput.dtoInventory` is replaced by `dtoDeclarationInventory`, narrowed to the complete inventory ADT.
- The scanner contract version advances from 33 to 34 because its input contract changed.
- The source AST pipeline invokes `scanDtoDeclarationInventory` before controller scanning and explicitly rejects an incomplete inventory with its blockers.
- The existing controller scanner projects declaration ASTs from the inventory receipt only when invoking the legacy integrated response pipeline.
- No new subscanner, relation layer, foundation layer, invocation authority, or response authority is introduced.

## Remaining integration debt

`LaravelControllerResponseIntegratedJudgmentInput` and several evidence-production/binding contracts still use `dtoInventory: readonly DtoAst[]`. This phase does not claim the declaration-resolution authority is wired into integrated response. The next migration must evolve those existing contracts and their implementations together, then replace legacy name/file matching with the existing PHP class-name authority and the DTO declaration judgment.

## Validation

ZIP integrity and source-diff inspection only. No build, typecheck, or full test suite was run.
