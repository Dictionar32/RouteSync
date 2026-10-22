# Phase 2206 — Interface-First Source-AST Evidence Producer Closure

## Goal

Continue from Phase 2205 by making migration discovery, attribute discovery, DTO declaration inventory, and query AST production explicit dependencies of the existing `LaravelSourceAstPipelineDependenciesInterface`. No alternate source-AST pipeline or semantic authority is introduced.

## Changes

- Added `LaravelMigrationScannerInterface` for canonical migration AST discovery.
- Added `LaravelAttributeScannerInterface` for attribute AST discovery.
- Added `LaravelDtoDeclarationInventoryScannerInterface`, whose result is the existing complete-or-incomplete `LaravelProjectDtoDeclarationInventoryInterface` judgment. An incomplete inventory is not converted into an empty successful inventory.
- Added `LaravelQueryProducerInterface` for projecting existing expression AST evidence into query ASTs.
- Expanded `LaravelSourceAstPipelineDependenciesInterface` and advanced `LaravelSourceAstPipelineInterface.contractVersion` from 7 to 8.
- The pipeline body now invokes these four dependencies through the upstream contract. Concrete implementations are selected once in the canonical composition root.

## Semantic invariants preserved

- The invocation inventory receipt remains the canonical source-bound invocation authority.
- The same schema interface is passed to the model scanner.
- DTO inventory completeness remains an explicit discriminated judgment; DTO AST publication projects declarations from the exact complete receipt.
- Query ASTs are derived from the source-AST semantic producer's expression products.
- Integrated response judgments and per-method response projection judgments remain owned by the existing response pipeline.

## Explicit limitations

This phase closes dependency selection at the source-AST pipeline boundary; it does not retire the historical implementation files under `compiler/scanner/subscanners`. The canonical composition root still imports existing implementations. It also does not eliminate existing `semantic/relations` helpers from pipeline collection shaping, nor close service, middleware, provider, channel, or all collection-shaping dependencies. No new relation, foundation, or subscanner layer was added.

## Validation

Syntax transpilation and structural checks are run during archive preparation. Full typecheck, Vitest, and package build are not claimed unless separately executed.
