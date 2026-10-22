# Phase 2313 — Source AST DTO Inventory Blocked Judgment

## Audit finding

The source-AST runtime executor previously threw an untyped `Error` when `LaravelDtoDeclarationInventoryScannerInterface.scan` returned `laravel_project_dto_declaration_inventory_incomplete`. This bypassed the declared `LaravelSourceAstProjectionJudgment` ADT and made the runtime executor the owner of failure signaling.

## Change

- Added `laravel_source_ast_projection_dto_declaration_inventory_blocked` to `LaravelSourceAstProjectionJudgment`.
- The new variant preserves the exact incomplete DTO inventory, source project, and invocation inventory receipt.
- `executeLaravelSourceAstPipeline` returns that variant immediately; controller scanning and downstream projections do not execute.
- `LaravelSourceAstPipelineInterface.contractVersion` is now 12.
- The manifest construction boundary recognizes this variant and rejects publication with its blocker kinds. It does not treat an incomplete DTO inventory as an empty or successful inventory.

## Scope and limits

This phase does not claim a project-wide TypeScript typecheck or integration test. It does not remove existing `semantic/relations` imports from the controller declaration parser. It adds no dependency on `semantic/foundation` or `semantic/relations`.
