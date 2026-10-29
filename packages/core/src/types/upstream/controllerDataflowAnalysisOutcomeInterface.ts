import type { ControllerDataflowSemanticJudgment } from './controllerDataflowSemanticJudgmentAuthorityInterface';
import type { ControllerDataflowDefinitionPayloadMetadata, ControllerDataflowSourcePayload } from './controllerDataflowBindingPayloadCorrespondenceInterface';
import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface';
import type { SemanticKnowledgeEvidenceProjection } from './semanticKnowledgeEvidenceAdapterInterface';
import type { SourceFile } from './names';

/** A controller analysis is publishable only when the evidence producer accepted its canonical knowledge. */
export interface ControllerDataflowAnalysisCompleted<Payload extends ControllerDataflowDefinitionPayloadMetadata> {
  readonly kind: 'controller_dataflow_analysis_completed';
  readonly judgment: ControllerDataflowSemanticJudgment<Payload>;
}

/** Blocked analysis retains the exact source, invocation, projection, violations and collected payload evidence. */
export interface ControllerDataflowAnalysisBlocked<Payload extends ControllerDataflowDefinitionPayloadMetadata> {
  readonly kind: 'controller_dataflow_analysis_blocked';
  readonly sourceFile: SourceFile;
  readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;
  readonly projection: Extract<SemanticKnowledgeEvidenceProjection['productionOutcome'], { readonly kind: 'blocked' }>;
  readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;
  readonly statementPayloads: readonly ControllerDataflowSourcePayload<Payload>[];
}

export type ControllerDataflowAnalysisOutcome<Payload extends ControllerDataflowDefinitionPayloadMetadata> =
  | ControllerDataflowAnalysisCompleted<Payload>
  | ControllerDataflowAnalysisBlocked<Payload>;

/** Domain operation contract for constructing terminal analysis outcomes. */
export interface ControllerDataflowAnalysisOutcomeOperationsInterface {
  readonly completed: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
    judgment: ControllerDataflowSemanticJudgment<Payload>,
  ) => ControllerDataflowAnalysisCompleted<Payload>;
  readonly blocked: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(input: Omit<ControllerDataflowAnalysisBlocked<Payload>, 'kind'>) => ControllerDataflowAnalysisBlocked<Payload>;
  readonly isPublishable: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(
    outcome: ControllerDataflowAnalysisOutcome<Payload>,
  ) => outcome is ControllerDataflowAnalysisCompleted<Payload>;
}

export const controllerDataflowAnalysisOutcomeOperations: ControllerDataflowAnalysisOutcomeOperationsInterface = Object.freeze({
  completed: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(judgment: ControllerDataflowSemanticJudgment<Payload>): ControllerDataflowAnalysisCompleted<Payload> => Object.freeze({
    kind: 'controller_dataflow_analysis_completed', judgment,
  }),
  blocked: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(input: Omit<ControllerDataflowAnalysisBlocked<Payload>, 'kind'>): ControllerDataflowAnalysisBlocked<Payload> => Object.freeze({
    kind: 'controller_dataflow_analysis_blocked', ...input,
  }),
  isPublishable: <Payload extends ControllerDataflowDefinitionPayloadMetadata>(outcome: ControllerDataflowAnalysisOutcome<Payload>): outcome is ControllerDataflowAnalysisCompleted<Payload> => outcome.kind === 'controller_dataflow_analysis_completed',
});
