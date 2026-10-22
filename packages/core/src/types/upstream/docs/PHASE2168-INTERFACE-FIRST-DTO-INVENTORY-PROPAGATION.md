# Phase 2168 — Interface-first DTO inventory propagation

## Trace finding

`scanDtoAsts(sourceProject)` previously ran after `laravelControllerScanner.scan(...)`. The integrated response judgment therefore could not receive the canonical DTO AST inventory produced by the same source-project scan.

## Changes

- `LaravelControllerScanInput` now carries `dtoInventory: readonly DtoAst[]` and scanner contract version 33.
- `laravelSourceAstPipeline.ts` invokes the existing `scanDtoAsts` before controller scanning and passes that exact inventory into the existing scanner interface.
- `LaravelControllerResponseIntegratedJudgmentInput` and `LaravelControllerResponseEvidenceProductionInput` carry the same inventory.
- The existing response evidence inventory and source-binding receipt preserve the inventory as project-scoped context. This is transport and ownership preservation, **not** a claim that DTO declarations are bound to the controller's exact source file.
- Existing response pipeline contract version is 19; response semantic judgment contract is version 9; evidence-production and evidence-binding contracts are version 8.
- No new authority, relation/foundation layer, or response subscanner was added.

## Deliberately unresolved

The producer still does not publish a resolved `ResponseContract` from the DTO inventory. `resolved_response_attribute_descriptor` and `response_dto_declaration` remain explicit missing evidence obligations. The existing source binding still applies same-file identity only to controller-owned evidence; DTO inventory is carried separately and must be resolved by a project-scoped, uniquely-resolved declaration contract before it can become response evidence.

The legacy response derivation is not retired. Removing it before the new DTO declaration judgment exists would be premature.

## Runtime boundary

Invocation authority and runtime executor remain unchanged in semantic responsibility. The existing response executor still delegates the source-bound response judgment. The DTO inventory is made available through the existing pipeline contracts; this phase does not pretend the response authority has already interpreted it.

## Verification

- Phase 2168 source/contract audit: 12 checks.
- Syntax-only TypeScript transpilation for changed TypeScript files.
- No full build, full typecheck, or Vitest run.
