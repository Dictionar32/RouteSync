# Phase 2296 — Attribute Producer and Pipeline Interface Boundaries

## Decision

The producer and pipeline should be contract-driven, but they do not belong at the same layer.

- The existing upstream `LaravelAttributeScannerInterface` is the source-project scan contract. Phase 2295 raised it to v13; Phase 2297 evolved it to v14 with explicit directory-enumeration evidence and recursive failure ADT.
- The existing upstream `LaravelSourceAstPipelineInterface` is already the pipeline execution contract (v9), with a closed projection judgment and an explicit dependency bundle.
- The per-declaration `AttributeProducer` contract has been moved out of its implementation file into `packages/core/src/compiler/scanner/attributeProducerInterface.ts` and named `AttributeProducerInterface`.

The producer contract remains in the compiler scanner layer because its input is `ControllerDeclarationAst<false>`, a compiler-owned parsed-syntax type. Moving that type dependency into `types/upstream` would invert the dependency direction rather than strengthen the architecture.

## Ownership boundaries

1. Source discovery, read/parse outcomes, and project-scope completeness: `LaravelAttributeScannerInterface` v14.
2. Parsed declaration → canonical `AttributeAst` structural projection: `AttributeProducerInterface`.
3. Whole-source acquisition orchestration and final complete/blocked AST projection: `LaravelSourceAstPipelineInterface` v9.
4. CLI composition: existing `scan.ts` → `controllerInvocationManifestComposition.ts` → `upstreamManifestBuilder.ts` → source-AST pipeline.

## Important incompatibility still exposed

The current `attributeAstCanonical.ts` producer returns contract version 7 and the old complete shape (`attributes`, old contextual inventory); it does not yet satisfy scanner contract v14 (`discoveryReceipt`, scoped inventory, typed discovery blockers). The pipeline currently reads `attributeScan.attributes`. Therefore this phase defines/separates the producer contract and records the existing pipeline boundary; it does **not** claim that producer, pipeline wiring, or CLI are migrated to v14.

The next implementation phase must adapt discovery/read/parse failure handling to the v14 judgment, make the producer return the v2 judgment, and then wire the already-existing pipeline contract. It must not make an unreadable or missing `app/Attributes` directory look like a complete empty scan. The path still has `semantic/relations` imports in `attributeProducer.ts` and `scannerUtils.ts`; those remain explicit migration debt, not something this contract move resolves.

## Site references

- TypeScript interfaces name structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions model outcome-specific shapes: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- MLIR interface rationale: transformations should depend on semantic interfaces rather than special-casing each concrete operation: https://mlir.llvm.org/docs/Interfaces/
- PHP `scandir()` failure is distinct from an empty directory: https://www.php.net/manual/en/function.scandir.php
- PHP `file_get_contents()` can fail: https://www.php.net/manual/en/function.file-get-contents.php
