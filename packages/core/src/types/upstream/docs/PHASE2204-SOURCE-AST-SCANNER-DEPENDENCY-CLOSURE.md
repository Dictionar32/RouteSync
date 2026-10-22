# Phase 2204 — Source-AST Scanner Dependency Closure

## Root finding

The source-AST pipeline had an injectable response scanner, but still selected controller, resource, and route scanners through module-level concrete imports inside the executor. Route binding authority was also selected there. That left the pipeline dependency contract incomplete even though upstream interfaces for these scanners already existed.

The same trace also exposed a publication defect: `SourceAsts.dtos` referenced `dtos`, which was not defined in the pipeline. DTO declarations had already been discovered into a complete, project-scoped inventory; the pipeline should project those exact declarations rather than perform another scan or invent a second source of truth.

## Changes

- Expanded the existing `LaravelSourceAstPipelineDependenciesInterface` to require the existing controller, resource, response, and route scanner interfaces plus the route binding authority.
- The pipeline executor now receives that dependency contract and delegates through its fields.
- Response scanning receives the response semantic pipeline already bound to the selected controller scanner, avoiding a separate hard-coded response-pipeline singleton.
- Published `laravelSourceAstPipelineDependencies` as the explicit composition-root value and wired the default pipeline through it.
- Derived `dtos` from the already-validated `dtoDeclarationInventory.receipt.declarations`; no second DTO discovery pass was added.
- Increased `LaravelSourceAstPipelineInterface.contractVersion` from 5 to 6.
- Added structural tests for composition identity and response-pipeline coherence.

## Trace after the change

`LaravelSourceAstPipelineDependenciesInterface`
→ selected controller scanner and its response pipeline
→ selected resource scanner
→ selected response scanner
→ selected route scanner + selected route binding authority
→ `SourceAsts` preserving invocation receipt and response projection judgments.

## Remaining direct implementation dependencies

This phase does **not** close every dependency in the source-AST executor. The following operations are still invoked directly and require a later interface-first trace against their proper existing owners: model scan, FormRequest scan, migration scan/interface projection, schema production, source-AST semantic production, query production, attribute scan, DTO inventory discovery, service scan, middleware scan, provider scan, channel scan, and collection/sequence shaping. The executor also still imports the legacy `semantic/relations` helpers. This phase adds no relation/foundation layer and does not claim the transitive relation dependency has been removed.

## Validation boundary

Syntax transpilation and source-structure assertions are suitable for this phase's checks. Full TypeScript typecheck, Vitest, and package build remain unclaimed unless separately executed.
