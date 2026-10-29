import { laravelControllerInvocationSemanticInputFactory } from './laravelControllerInvocationSemanticJudgmentAuthority';
import type {
  LaravelControllerInvocationSemanticJudgmentPreparationEvidence,
  LaravelControllerInvocationSemanticJudgmentPreparationFactoryInterface,
  LaravelControllerInvocationSemanticJudgmentPreparationInput,
  LaravelControllerInvocationSemanticJudgmentPreparationInputData,
  LaravelControllerInvocationSemanticJudgmentPreparationInputFactoryInterface,
  LaravelControllerInvocationSemanticJudgmentPreparationDependencies,
  LaravelControllerInvocationSemanticJudgmentPreparationJudgment,
} from './laravelControllerInvocationSemanticJudgmentPreparationInterface';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import { sourceFileInventoryFactory, type SourceFileInventory } from './names';
import type { PhpSourceDocument } from './phpSourceFrontendInterface';


interface SourceFileInventoryFromDocumentsInterface {
  readonly from: (documents: readonly PhpSourceDocument[], accumulated: SourceFileInventory) => SourceFileInventory;
}

const sourceFileInventoryFromDocuments: SourceFileInventoryFromDocumentsInterface = Object.freeze({
  from: (documents: readonly PhpSourceDocument[], accumulated: SourceFileInventory): SourceFileInventory => {
    if (documents.length === 0) return accumulated;
    const [document, ...remaining] = documents;
    return sourceFileInventoryFromDocuments.from(remaining, accumulated.include(document!.sourceFile));
  },
});

const prepared = (
  evidence: LaravelControllerInvocationSemanticJudgmentPreparationEvidence,
): LaravelControllerInvocationSemanticJudgmentPreparationJudgment => Object.freeze({
  ...evidence,
  continueWith: <Result>(handlers: { readonly onPrepared: (value: LaravelControllerInvocationSemanticJudgmentPreparationEvidence) => Result }): Result => handlers.onPrepared(evidence),
});


/** Canonical input constructor: the ADT carries the domain operation that continues preparation. */
export const laravelControllerInvocationSemanticJudgmentPreparationInputFactory: LaravelControllerInvocationSemanticJudgmentPreparationInputFactoryInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_preparation_input_factory',
  create: (data: LaravelControllerInvocationSemanticJudgmentPreparationInputData): LaravelControllerInvocationSemanticJudgmentPreparationInput => {
    let input: LaravelControllerInvocationSemanticJudgmentPreparationInput;
    input = Object.freeze({
      ...data,
      continueToPreparation: (dependencies: LaravelControllerInvocationSemanticJudgmentPreparationDependencies): LaravelControllerInvocationSemanticJudgmentPreparationJudgment =>
        laravelControllerInvocationSemanticJudgmentPreparationFactory.prepare(input, dependencies),
    });
    return input;
  },
});

export const laravelControllerInvocationSemanticJudgmentPreparationFactory: LaravelControllerInvocationSemanticJudgmentPreparationFactoryInterface = Object.freeze({
  kind: 'laravel_controller_invocation_semantic_judgment_preparation_factory',
  prepare: (
    input: LaravelControllerInvocationSemanticJudgmentPreparationInput,
    dependencies: LaravelControllerInvocationSemanticJudgmentPreparationDependencies,
  ): LaravelControllerInvocationSemanticJudgmentPreparationJudgment => {
    const delivery = dependencies.delivery.deliver(Object.freeze(input.documents.map(document => dependencies.pipeline.analyze(document))));
    const judgments: LaravelControllerInvocationSemanticJudgmentInterface[] = [];
    for (const pipelineResult of delivery.entries) {
      judgments.push(dependencies.judgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withPipeline(
        pipelineResult.document.sourceFile,
        pipelineResult,
      )));
    }
    const sources = sourceFileInventoryFromDocuments.from(
      input.documents,
      sourceFileInventoryFactory.empty(),
    );
    const evidence: LaravelControllerInvocationSemanticJudgmentPreparationEvidence = Object.freeze({
      kind: 'laravel_controller_invocation_semantic_judgment_preparation_complete',
      sourceInventory: Object.freeze({
        kind: 'laravel_controller_source_inventory',
        contractVersion: 2,
        sourceProject: input.discoverySourceProject,
        sources,
        completeness: Object.freeze({
          kind: 'laravel_controller_source_inventory_completeness_witness',
          sourceProject: input.requestedSourceProject,
          obligations: Object.freeze([
            'source-project-identity-matches-the-inventory-project',
            'all-controller-source-files-discovered-for-the-source-project',
            'empty-controller-source-set-is-explicitly-certified-when-applicable',
            'each-source-file-identity-is-canonical-and-unique',
          ] as const),
        }),
      }),
      judgments: Object.freeze(judgments),
    });
    return prepared(evidence);
  },
});
