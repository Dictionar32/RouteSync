# Phase 2179 — Interface-First Closed DTO Inventory Retention

## Trace

The Phase 2178 integrated response input accepted a complete DTO discovery inventory, but `judgeIntegratedResponse` immediately projected its receipt to `readonly DtoAst[]` before calling the existing evidence producer. The evidence-production inventory and source-binding judgment then carried the raw array, erasing discovery provenance and its closed ADT at the next boundaries.

## Change

- `LaravelControllerResponseEvidenceProductionInput` now accepts the complete `LaravelProjectDtoDeclarationInventoryInterface` variant as `dtoDeclarationInventory`.
- Both production-inventory outcomes and all source-binding outcomes retain that same closed inventory ADT.
- `judgeIntegratedResponse` forwards the original inventory directly to evidence production; it no longer maps declaration evidence into a raw AST array.
- The existing response authority and runtime executor still own response meaning and execution respectively. The existing invocation judgment remains the exact generic provenance parameter; no duplicate invocation authority was added.
- Evidence production, source binding, response judgment, and integrated pipeline contract versions were advanced to reflect their changed contracts.

## Architectural boundary

This closes inventory provenance across the existing integrated response pipeline. It does not yet resolve each response attribute's DTO class reference or attach `LaravelControllerResponseDtoDeclarationResolutionJudgment` to the response evidence. The current evidence coverage therefore continues to state that resolved DTO declaration evidence is missing. That is the next semantic integration step; this phase does not claim it is already wired.

No `relation`/`foundation` layer or new subscanner was introduced. Build, TypeScript typecheck, and full tests were not run.
