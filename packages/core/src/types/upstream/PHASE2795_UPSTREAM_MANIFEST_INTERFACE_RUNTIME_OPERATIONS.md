# Phase 2795 — Upstream Manifest Interface-First Runtime Operations

## Scope and contract-first review

This phase continues the Fully Typed Runtime Scanner Operations audit at the manifest-producing path. Before changing the operation surface, the existing upstream contracts were inspected: `SemanticDataflowManifestSurfaceInterface`, `ManifestBuilderOperationPreparationInterface`, `ManifestBuilderInterface` / `ManifestBuilderJudgment`, `LaravelSourceAstPipelineInterface` / `LaravelSourceAstProjectionJudgment`, and the CLI scanner operation contract.

The manifest dataflow surface already had a named interface describing the complete operation shape. Its exported factory and two exported forwarding functions were redundant public runtime entry points, not distinct domain authorities. No new upstream interface or ADT was needed.

## Applied migration

`semanticDataflowManifestSurface.ts` now exports the canonical runtime surface as:

```ts
export const semanticDataflowManifestSurface: SemanticDataflowManifestSurfaceInterface = Object.freeze({
  kind: 'semantic_dataflow_manifest_surface',
  inputsFromSourceModel: (sourceModel: CompleteLaravelSourceModel): Sequence<SemanticDataflowInput> =>
    semanticDataflowInputProducer.sourceModelSeeds(sourceModel),
  judgmentsFromInputs: (inputs: Sequence<SemanticDataflowInput>): Sequence<SemanticDataflowJudgment> =>
    judgmentsFromInputs(inputs, semanticDataflowReasoningAuthority),
  queryPolicyContractsFromJudgments: (judgments, intent) => /* existing domain operation */,
});
```

The `createSemanticDataflowManifestSurface(...)` exported factory and the exported forwarding functions `semanticDataflowInputsFromSourceModel(...)` / `semanticDataflowJudgmentsFromInputs(...)` were removed. Their responsibilities now live on the existing interface-typed frozen object. The recursive judgment helper remains private and preserves the existing `Sequence` ADT semantics. The manifest builder continues to consume `semanticDataflowManifestSurface` directly.

## Runtime trace: CLI → upstream manifest

```text
packages/cli/src/commands/scan.ts / sync.ts
  -> composition.manifestScanOperation.scan(input)
  -> controller-invocation manifest composition
  -> ManifestBuilderOperationPreparationInterface.prepare(input)
  -> ManifestBuilderInterface.build()
  -> LaravelSourceAstPipelineInterface.execute()
  -> LaravelSourceAstProjectionJudgment
       ├─ complete -> CompleteSourceAst -> source-model build
       └─ blocked  -> preserve exact source-AST blocker
  -> source-model judgment
       ├─ complete -> semanticDataflowManifestSurface operations
       └─ blocked  -> ManifestBuilderJudgment(stage: source_model)
  -> ManifestBuilderJudgment
       ├─ manifest_builder_complete -> canonical RouteSyncManifest
       └─ manifest_builder_blocked -> preserve stage and blocker
  -> CLI projection / validation / serialization / persistence
```

The pipeline factory and manifest preparation are already interface-typed frozen operation objects, so this phase leaves their existing contracts and wiring intact. The scanner flow operation continues to preserve `manifest_builder_blocked`; it does not turn a blocked judgment into an empty or successful manifest.

## Explicit ADT and primitive boundary

No new generic reasoning primitive, generic relation utility, or result wrapper was introduced. Existing discriminated judgments remain the outcome model. Exhaustive ADT elimination may remain inside the owning operation; this change does not mechanically remove legitimate `switch` statements. `packages/core/src/types/upstream/collections.ts` remains exactly 0 bytes.

## Verification boundary

The structural audit checks the interface-first runtime shape, consumer migration, existing contract reuse, CLI wiring, ADT preservation, and empty collections file. It is not a full TypeScript typecheck, build, full test suite, or CLI scan/sync end-to-end test. Those are not claimed unless run separately.
