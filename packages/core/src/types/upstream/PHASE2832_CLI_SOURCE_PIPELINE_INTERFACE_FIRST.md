# Phase 2832 — CLI source-invocation pipeline interface-first runtime

## Scope

The existing CLI source invocation pipeline is already backed by upstream semantic authorities. This phase does not create a second semantic contract or new ADT. It makes the public CLI runtime boundary interface-first and ensures the manifest composition consumer uses that boundary.

## Runtime path

`ControllerInvocationManifestCompositionAuthorityInterface.compose(input)`
→ source discovery and document reading
→ `sourceInvocationPipeline: PhpSourceInvocationSemanticPipelineInterface`
→ `phpSourceInvocationSemanticPipelineOperations.analyze(document)`
→ upstream PHP frontend / extraction validation / source inventory / environment projection / name resolution / invocation judgment
→ separately typed `PhpSourceInvocationSemanticPipelineDeliveryInterface`
→ source-correlated judgments
→ upstream inventory authority
→ `ManifestBuilderOperationPreparationInterface`
→ `ManifestBuilderJudgment`
→ CLI manifest projection.

The operation object exposes `analyze` and `analyzeBatch`; the concrete authority instance is private to `sourceInvocationPipeline.ts`. The CLI PHP barrel exports the operation object and its interface, not the raw authority instance. Existing upstream result ADTs, identity binding, delivery semantics, and complete/blocked/rejected distinctions remain owned by their existing contracts.

## Domain continuation

- `analyze(document)` continues a single source document through the configured upstream semantic pipeline.
- `analyzeBatch(documents)` analyzes each document once and delivers the frozen batch through the existing upstream delivery operation.
- The manifest composition receives the operation object through its explicit `sourceInvocationPipeline` dependency.
- Pipeline delivery remains a separate dependency because delivery and analysis are distinct domain operations.

## Validation

Run `npm run audit:phase2832-cli-source-pipeline-interface-first`.
The audit checks the runtime export shape, concrete consumer wiring, preservation of the existing upstream interface, distinct delivery boundary, and the empty `collections.ts` invariant. It is a structural audit, not a substitute for a full TypeScript build or end-to-end CLI manifest scan.
