# Phase 2205 — Model and FormRequest Upstream Contract Closure

## Root cause

`LaravelSourceAstPipelineInterface` already depended on upstream controller/resource/response/route contracts, but the executor still selected model and FormRequest scanners, schema production, and source-AST semantic production directly. The model contract also described model AST/definition pairs without retaining the class identity derived from the same source declaration. The FormRequest implementation exposed source, AST, and definition through parallel collections, so the upstream contract could not itself guarantee per-request provenance.

## Changes

- Extended `LaravelSourceAstPipelineDependenciesInterface` with the existing `LaravelModelScannerInterface`, `LaravelFormRequestScannerInterface`, `SchemaProducer`, and `SourceAstSemanticProducerInterface` contracts.
- Added composition-root adapters for the existing model and FormRequest scanner implementations; the pipeline executor now invokes them through the dependency contract.
- Strengthened `LaravelModelScanArtifact` to carry the exact `ControllerStaticCallModelClassIdentity` derived from the same model declaration. Model scanner contract version increased from 2 to 3.
- Strengthened `LaravelFormRequestScanJudgment` to retain the complete source inventory separately from correlated request artifacts. Each artifact binds source evidence, AST, and definition in one object. FormRequest scanner contract version increased from 2 to 3.
- Changed FormRequest artifact construction to retain the source beside the producer result at the point where that result is created. AST and definitions are then projected from the correlated artifacts, not paired afterward by index.
- The source-AST pipeline now obtains schema and source semantic products through the injected contracts. Pipeline contract version increased from 6 to 7.
- Added a focused dependency-contract test.

## Trace

`invocationInventoryReceipt` remains the canonical pipeline input. The pipeline obtains migration-derived schema through the injected schema producer, then passes that schema into the model scanner contract. Model artifacts retain AST, definition, and class identity together. FormRequest scan judgment retains full source inventory plus correlated source/AST/definition artifacts. The same injected source semantic producer supplies expression, assignment, and property products. Existing integrated invocation/response judgment flow is unchanged.

## Constraints

No new semantic authority, invocation authority, `semantic/foundation` layer, relation layer, or replacement subscanner layer was added. Existing scanner implementations remain transitional implementations behind the upstream contracts; this phase does not claim their retirement or eliminate legacy relation imports from the whole pipeline.

## Validation status

Syntax transpilation and structural assertions are recorded in the phase audit. Full TypeScript typecheck, Vitest, and package build have not been run.
